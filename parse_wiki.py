import json
import re
import random
from bs4 import BeautifulSoup

f = open("./list_of_street_food.html", "r");
html_doc = f.read();
soup = BeautifulSoup(html_doc, 'html.parser');

table = soup.find("table");
data = [];

def clean_text(text):
    # NOTE: remove any newlines
    text = text.replace('\n', '')
    # NOTE: remove any footnote references
    text = re.sub('\[[0-9]*\]', '', text)
    return text

for row in table.findAll("tr"):
    cells = row.findAll("td")
    if (len(cells) > 0):
      image_cell = cells[0]
      name_cell = cells[1]
      regions_cell = cells[2]
      description_cell = cells[3]
      region = regions_cell.get_text()
      description = description_cell.get_text()

      food = {}
      if region:
          food['region'] = clean_text(region)

      if description:
          food['description'] = clean_text(description)

      if name_cell.a:
          food['name'] = clean_text(name_cell.a.get_text())
          food['url'] = "https://en.wikipedia.org" + name_cell.a.get("href")
      else:
          food['name'] = name_cell.get_text()

      if image_cell.a and image_cell.a.img:
          images = image_cell.a.img.get('srcset').split(' ')
          imageURL = images[len(images) - 2]
          food['imageURL'] = "https:" + imageURL
          data.append(food)
      else:
          del food

with open('src/data.json', 'w') as f:
    random.shuffle(data)
    json.dump(data, f)

print("Done. Check data.json")
