import requests
from bs4 import BeautifulSoup
import json
import os

ARCHIVE_URL = "https://www.singaporepools.com.sg/DataFileArchive/Lottery/Output/toto_result_top_draws_en.html"
OUTPUT_FILE = "docs/toto_result.json"

def fetch_draws_from_archive():
    res = requests.get(ARCHIVE_URL)
    res.raise_for_status()
    soup = BeautifulSoup(res.text, "html.parser")

    draw_blocks = soup.select("li > div.tables-wrap")
    seen_draw_numbers = set()
    results = []

    for block in draw_blocks:
        try:
            date = block.select_one(".drawDate").text.strip()
            draw_number = block.select_one(".drawNumber").text.strip().replace("Draw No. ", "")

            if draw_number in seen_draw_numbers:
                print(f"[!] Skipping duplicate draw number in archive: {draw_number}")
                continue
            seen_draw_numbers.add(draw_number)

            winning_numbers = [td.text.strip() for td in block.select("table:nth-of-type(2) tbody td")]
            additional_number = block.select_one("table:nth-of-type(3) .additional").text.strip()
            jackpot = block.select_one("table.jackpotPrizeTable .jackpotPrize").text.strip()

            group_rows = block.select("table.tableWinningShares tbody tr")[1:]
            group_prizes = []
            for row in group_rows:
                cols = row.find_all("td")
                if len(cols) == 3:
                    group = cols[0].text.strip()
                    amount = cols[1].text.strip()
                    shares = cols[2].text.strip()
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
            print(f"[!] Error parsing block: {e}")
            continue

    return results

def load_existing_results():
    if os.path.exists(OUTPUT_FILE):
        with open(OUTPUT_FILE, "r") as f:
            return json.load(f)
    return []

def save_results(data):
    with open(OUTPUT_FILE, "w") as f:
        json.dump(data, f, indent=2)

def main():
    print("[+] Fetching archive draws...")
    archive_draws = fetch_draws_from_archive()
    existing_draws = load_existing_results()

    existing_draw_map = {d["draw_number"]: d for d in existing_draws}
    added = 0
    skipped = 0

    for draw in archive_draws:
        if draw["draw_number"] in existing_draw_map:
            print(f"[=] Skipped existing draw: {draw['draw_number']}")
            skipped += 1
        else:
            existing_draws.append(draw)
            print(f"[+] Added new draw: {draw['draw_number']}")
            added += 1

    # Sort latest draw first
    existing_draws.sort(key=lambda x: int(x["draw_number"]), reverse=True)
    save_results(existing_draws)

    print(f"[✓] Added {added} new draw(s), skipped {skipped} existing.")
    print(f"[✓] Saved to {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
