#!/usr/bin/env python3
"""
Taiwan Land Data Import Script
Parses XML (attributes) and KML (geometry) files and imports into PostgreSQL
"""

import os
import sys
import logging
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from lxml import etree
import psycopg2
from psycopg2.extras import execute_batch
from tqdm import tqdm
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class LandDataImporter:
    """Handles importing land data from XML/KML files to PostgreSQL"""

    def __init__(self, data_dir: str, db_url: str):
        self.data_dir = Path(data_dir)
        self.db_url = db_url
        self.conn = None
        self.stats = {
            'files_processed': 0,
            'lands_imported': 0,
            'errors': 0
        }

    def connect_db(self):
        """Establish database connection"""
        try:
            self.conn = psycopg2.connect(self.db_url)
            logger.info("Database connection established")
        except Exception as e:
            logger.error(f"Failed to connect to database: {e}")
            raise

    def close_db(self):
        """Close database connection"""
        if self.conn:
            self.conn.close()
            logger.info("Database connection closed")

    def parse_xml_file(self, xml_path: Path) -> List[Dict]:
        """
        Parse XML file to extract land attributes

        Returns list of land records with attributes
        """
        lands = []

        try:
            tree = etree.parse(str(xml_path))
            root = tree.getroot()

            # Find all 土地標示部 elements
            for land_elem in root.findall('.//土地標示部'):
                land_data = {
                    'city': self._get_text(land_elem, '縣市'),
                    'district': self._get_text(land_elem, '鄉鎮市區'),
                    'section_code': self._get_text(land_elem, '段代碼'),
                    'section_name': self._get_text(land_elem, '段小段'),
                    'parcel_no': self._get_text(land_elem, '地號'),
                    'area': self._get_decimal(land_elem, '登記面積'),
                    'land_use_zone': self._get_text(land_elem, '使用分區'),
                    'land_use_type': self._get_text(land_elem, '使用地類別'),
                    'announced_value': self._get_int(land_elem, '公告現值'),
                    'announced_land_price': self._get_int(land_elem, '公告地價'),
                }

                # Parse owner information (所有權人)
                owner_elem = land_elem.find('所有權人')
                if owner_elem is not None:
                    land_data.update({
                        'owner_name': self._get_text(owner_elem, '所有權人名稱'),
                        'owner_id': self._get_text(owner_elem, '統一編號'),
                        'owner_type': self._get_text(owner_elem, '所有權人類別'),
                        'right_range_type': self._get_text(owner_elem, '權利範圍類別'),
                        'right_denominator': self._get_int(owner_elem, '權利範圍持分分母'),
                        'right_numerator': self._get_int(owner_elem, '權利範圍持分分子'),
                        'declared_land_price': self._get_int(owner_elem, '申報地價'),
                        'manager_name': self._get_text(owner_elem, '管理者名稱'),
                    })

                lands.append(land_data)

        except Exception as e:
            logger.error(f"Error parsing XML file {xml_path}: {e}")
            self.stats['errors'] += 1

        return lands

    def parse_kml_file(self, kml_path: Path) -> Dict[str, str]:
        """
        Parse KML file to extract polygon geometries

        Returns dict mapping parcel_no to WKT polygon string
        """
        geometries = {}

        try:
            tree = etree.parse(str(kml_path))
            root = tree.getroot()

            # Define KML namespace
            ns = {'kml': 'http://www.opengis.net/kml/2.2'}

            # Find all Placemark elements
            for placemark in root.findall('.//kml:Placemark', ns):
                # Get parcel number from ExtendedData
                parcel_no = None
                schema_data = placemark.find('.//kml:SchemaData', ns)
                if schema_data is not None:
                    for simple_data in schema_data.findall('kml:SimpleData', ns):
                        if simple_data.get('name') == 'PARCELNO':
                            parcel_no = simple_data.text
                            break

                if not parcel_no:
                    continue

                # Get polygon coordinates
                coordinates_elem = placemark.find('.//kml:coordinates', ns)
                if coordinates_elem is not None and coordinates_elem.text:
                    wkt_polygon = self._kml_coords_to_wkt(coordinates_elem.text)
                    if wkt_polygon:
                        geometries[parcel_no] = wkt_polygon

        except Exception as e:
            logger.error(f"Error parsing KML file {kml_path}: {e}")
            self.stats['errors'] += 1

        return geometries

    def _kml_coords_to_wkt(self, coords_text: str) -> Optional[str]:
        """
        Convert KML coordinates to WKT POLYGON format

        KML format: "lon,lat,alt lon,lat,alt ..."
        WKT format: "POLYGON((lon lat, lon lat, ...))"
        """
        try:
            coords = coords_text.strip().split()
            points = []

            for coord in coords:
                parts = coord.split(',')
                if len(parts) >= 2:
                    lon, lat = parts[0], parts[1]
                    points.append(f"{lon} {lat}")

            if len(points) >= 3:
                # Ensure polygon is closed
                if points[0] != points[-1]:
                    points.append(points[0])

                wkt = f"POLYGON(({', '.join(points)}))"
                return wkt

        except Exception as e:
            logger.warning(f"Failed to convert coordinates: {e}")

        return None

    def _get_text(self, elem, tag: str) -> Optional[str]:
        """Safely get text content from XML element"""
        child = elem.find(tag)
        if child is not None and child.text:
            return child.text.strip()
        return None

    def _get_int(self, elem, tag: str) -> Optional[int]:
        """Safely get integer from XML element"""
        text = self._get_text(elem, tag)
        if text:
            try:
                return int(text)
            except ValueError:
                pass
        return None

    def _get_decimal(self, elem, tag: str) -> Optional[float]:
        """Safely get decimal from XML element"""
        text = self._get_text(elem, tag)
        if text:
            try:
                return float(text)
            except ValueError:
                pass
        return None

    def _normalize_parcel_no(self, parcel_no: str) -> str:
        """
        Normalize parcel number for matching between XML and KML

        XML: "00170001" -> KML: "17-1"
        """
        if not parcel_no:
            return ""

        # Remove leading zeros from main part
        parcel_no = parcel_no.lstrip('0')

        # Handle sub-parcel format (e.g., "00170001" might be "17-1")
        # This is a simplified normalization - may need adjustment based on actual data
        if len(parcel_no) >= 4:
            # Try to match patterns like "00170001" to "17-1"
            main = parcel_no[:4].lstrip('0')
            sub = parcel_no[4:].lstrip('0')

            if sub and sub != '0':
                return f"{main}-{sub}"
            else:
                return main if main else "0"

        return parcel_no

    def import_file_pair(self, xml_path: Path, kml_path: Path) -> int:
        """
        Import a pair of XML and KML files

        Returns number of records imported
        """
        # Parse both files
        lands = self.parse_xml_file(xml_path)
        geometries = self.parse_kml_file(kml_path)

        if not lands:
            logger.warning(f"No land data found in {xml_path}")
            return 0

        # Prepare insert data
        insert_data = []

        for land in lands:
            # Try to find matching geometry
            parcel_no = land.get('parcel_no', '')
            normalized_parcel = self._normalize_parcel_no(parcel_no)

            # Try different formats to match
            geometry_wkt = None
            for key in [parcel_no, normalized_parcel]:
                if key in geometries:
                    geometry_wkt = geometries[key]
                    break

            if not geometry_wkt:
                logger.debug(f"No geometry found for parcel {parcel_no} (normalized: {normalized_parcel})")
                # Skip records without geometry for now
                continue

            insert_data.append((
                land.get('section_code'),
                land.get('section_name'),
                land.get('parcel_no'),
                land.get('city'),
                land.get('district'),
                land.get('area'),
                land.get('land_use_zone'),
                land.get('land_use_type'),
                land.get('announced_value'),
                land.get('announced_land_price'),
                land.get('owner_name'),
                land.get('owner_id'),
                land.get('owner_type'),
                land.get('right_range_type'),
                land.get('right_denominator'),
                land.get('right_numerator'),
                land.get('declared_land_price'),
                land.get('manager_name'),
                geometry_wkt
            ))

        # Bulk insert
        if insert_data:
            try:
                cursor = self.conn.cursor()

                insert_sql = """
                    INSERT INTO lands (
                        section_code, section_name, parcel_no, city, district,
                        area, land_use_zone, land_use_type, announced_value,
                        announced_land_price, owner_name, owner_id, owner_type,
                        right_range_type, right_denominator, right_numerator,
                        declared_land_price, manager_name, geometry
                    ) VALUES (
                        %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                        %s, %s, %s, %s, %s, %s, %s, %s,
                        ST_GeomFromText(%s, 4326)
                    )
                """

                execute_batch(cursor, insert_sql, insert_data, page_size=1000)
                self.conn.commit()
                cursor.close()

                return len(insert_data)

            except Exception as e:
                logger.error(f"Error inserting data: {e}")
                self.conn.rollback()
                self.stats['errors'] += 1
                return 0

        return 0

    def import_all_files(self):
        """Import all XML/KML file pairs from data directory"""
        # Find all XML files
        xml_files = sorted(self.data_dir.glob('*.xml'))

        logger.info(f"Found {len(xml_files)} XML files to process")

        # Process each file pair
        for xml_path in tqdm(xml_files, desc="Importing land data"):
            kml_path = xml_path.with_suffix('.kml')

            if not kml_path.exists():
                logger.warning(f"Missing KML file: {kml_path}")
                self.stats['errors'] += 1
                continue

            imported = self.import_file_pair(xml_path, kml_path)
            self.stats['files_processed'] += 1
            self.stats['lands_imported'] += imported

            # Commit every 10 files to avoid long transactions
            if self.stats['files_processed'] % 10 == 0:
                self.conn.commit()
                logger.info(f"Progress: {self.stats['files_processed']} files, "
                          f"{self.stats['lands_imported']} lands imported")

        # Final commit
        self.conn.commit()

        # Print summary
        logger.info("=" * 60)
        logger.info("Import completed!")
        logger.info(f"Files processed: {self.stats['files_processed']}")
        logger.info(f"Lands imported: {self.stats['lands_imported']}")
        logger.info(f"Errors: {self.stats['errors']}")
        logger.info("=" * 60)


def main():
    # Load environment variables
    load_dotenv()

    # Configuration
    data_dir = os.getenv('DATA_DIR', './ALL')
    db_url = os.getenv('DATABASE_URL',
                       'postgresql://landuser:landpass123@localhost:5432/land_data')

    # Validate data directory
    if not os.path.isdir(data_dir):
        logger.error(f"Data directory not found: {data_dir}")
        sys.exit(1)

    # Create importer and run
    importer = LandDataImporter(data_dir, db_url)

    try:
        importer.connect_db()
        importer.import_all_files()
    except Exception as e:
        logger.error(f"Import failed: {e}")
        sys.exit(1)
    finally:
        importer.close_db()


if __name__ == '__main__':
    main()
