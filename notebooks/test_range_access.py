import sys
from pathlib import Path
import requests

# Ensure backend directory is in sys.path before importing app
backend_dir = Path(__file__).resolve().parent.parent / "backend"
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

# pyrefly: ignore[missing-import]
# type: ignore[import-not-found]
from app.services.bhoonidhi_service import bhoonidhi_service


ITEM_ID = (
    "NISAR_S2_PR_GCOV_029_040_A_015_3700_DHNA_A_20260827T230526_20260827T230602_P00500_M_F_I_001"
)

COLLECTION = "NISAR_SSAR_GCOV"


def test_range_access():
    print("Getting Bhoonidhi access token...")

    token = bhoonidhi_service.get_valid_access_token()

    url = f"{bhoonidhi_service.base_url}/download"

    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "*/*",
        "Range": "bytes=0-511",
    }

    params = {
        "id": ITEM_ID,
        "collection": COLLECTION,
    }

    response = None

    try:
        print("Requesting only the first 512 bytes...")

        response = requests.get(
            url,
            params=params,
            headers=headers,
            stream=True,
            allow_redirects=False,
            timeout=60,
        )

        print("\n========== RANGE TEST RESULTS ==========")
        print("HTTP Status:", response.status_code)
        print("Accept-Ranges:", response.headers.get("Accept-Ranges"))
        print("Content-Range:", response.headers.get("Content-Range"))
        print("Content-Length:", response.headers.get("Content-Length"))

        if response.status_code == 206:
            # Read no more than the requested 512 bytes.
            data = response.raw.read(512, decode_content=False)

            print("Bytes received:", len(data))
            print("HDF5 signature:", data[:8].hex(" "))

            expected_signature = b"\x89HDF\r\n\x1a\n"

            if data[:8] == expected_signature:
                print("HDF5 signature verified!")
            else:
                print("Range supported, but HDF5 signature not verified.")

        elif response.status_code == 200:
            print("Server returned HTTP 200 instead of 206.")
            print("Range may have been ignored. No response body was read.")

        else:
            print("Range request was not successful.")
            print("Do not retry yet. Inspect the response first.")

        print("========================================")

    except requests.RequestException as error:
        print("Request failed:", type(error).__name__)
        print("Check connection and Bhoonidhi service status.")

    finally:
        if response is not None:
            response.close()


if __name__ == "__main__":
    test_range_access()
