import requests
from bs4 import BeautifulSoup
import json
import os

URL = "https://www.singaporepools.com.sg/DataFileArchive/Lottery/Output/toto_result_top_draws_en.html"
OUTPUT = "docs/toto_result.json"

def parse_toto_page():
    response = requests.get(URL)
    response.raise_for_status()
    soup = BeautifulSoup(response.text, "html.parser")

    results = []

    for draw in soup.select("li > div.tables-wrap"):
        try:
            date = draw.select_one(".drawDate").get_text(strip=True)
            draw_number = draw.select_one(".drawNumber").get_text(strip=True).replace("Draw No. ", "")
            winning_numbers = [td.get_text(strip=True) for td in draw.select("table:nth-of-type(2) tbody td")]
            additional_number = draw.select_one("table:nth-of-type(3) .additional").get_text(strip=True)
            jackpot = draw.select_one("table.jackpotPrizeTable .jackpotPrize").get_text(strip=True)

            # Parse group prizes
            prize_rows = draw.select("table.tableWinningShares tbody tr")[1:]  # skip table headers
            group_prizes = []
            for row in prize_rows:
                cols = row.find_all("td")
                if len(cols) == 3:
                    group = cols[0].get_text(strip=True)
                    amount = cols[1].get_text(strip=True)
                    shares = cols[2].get_text(strip=True)
                    group_prizes.append({
                        "group": group,
                        "amount": amount,
                        "shares": shares
                    })

            results.append({
                "date": date,
                "draw_number": draw_number,
                "winning_numbers": winning_numbers,
                "additional_number": additional_number,
                "jackpot": jackpot,
                "group_prizes": group_prizes
            })

        except Exception as e:
            print(f"[!] Error parsing draw block: {e}")
            continue

    return results

def load_existing():
    if os.path.exists(OUTPUT):
        with open(OUTPUT, "r") as f:
            return json.load(f)
    return []

def save_results(data):
    with open(OUTPUT, "w") as f:
        json.dump(data, f, indent=2)

def main():
    new_results = parse_toto_page()
    existing_results = load_existing()

    if not existing_results or new_results[0]["draw_number"] != existing_results[0]["draw_number"]:
        print("[+] New result detected. Saving...")
        save_results(new_results)
    else:
        print("[=] No new results.")

if __name__ == "__main__":
    main()
