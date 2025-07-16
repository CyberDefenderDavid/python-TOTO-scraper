import requests
from bs4 import BeautifulSoup
import json
import os

URL = "https://www.singaporepools.com.sg/DataFileArchive/Lottery/Output/toto_result_top_draws_en.html"
RESULT_FILE = "docs/toto_result.json"

def fetch_toto_results():
    response = requests.get(URL)
    response.raise_for_status()
    soup = BeautifulSoup(response.text, "html.parser")

    results = []
    rows = soup.select("table tbody tr")
    for row in rows:
        cols = row.find_all("td")
        if len(cols) < 5:
            continue

        date = cols[0].get_text(strip=True)
        draw_number = cols[1].get_text(strip=True)
        winning_numbers = [n.strip() for n in cols[2].get_text(strip=True).split(",")]
        additional_number = cols[3].get_text(strip=True)

        results.append({
            "date": date,
            "draw_number": draw_number,
            "winning_numbers": winning_numbers,
            "additional_number": additional_number,
        })

    return results

def load_existing():
    if os.path.exists(RESULT_FILE):
        with open(RESULT_FILE, "r") as f:
            return json.load(f)
    return []

def save_results(data):
    with open(RESULT_FILE, "w") as f:
        json.dump(data, f, indent=2)

def main():
    new_results = fetch_toto_results()
    existing_results = load_existing()

    if not existing_results or new_results[0]["draw_number"] != existing_results[0]["draw_number"]:
        print("[+] New result found. Updating file.")
        save_results(new_results)
    else:
        print("[=] No update. Latest result already stored.")

if __name__ == "__main__":
    main()
