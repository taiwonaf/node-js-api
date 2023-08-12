const http = require("http");
const fs = require("fs");
const { parse } = require("querystring");

const port = 3000;
const DATA_FILE = "items.json";

// Load data from JSON file
const loadData = () => {
  try {
    const data = fs.readFileSync(DATA_FILE, "utf8");
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
};

// Save data to JSON file
const saveData = (data) => {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 4), "utf8");
};

const server = http.createServer((req, res) => {
  const { method, url } = req;

  if (method === "GET") {
    if (url === "/items") {
      const data = loadData();
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(data));
    } else if (url.startsWith("/items/")) {
      const itemId = parseInt(url.split("/")[2]);
      const data = loadData();
      const item = data.find((item) => item.id === itemId);

      if (item) {
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify(item));
      } else {
        res.statusCode = 404;
        res.end("Item not found");
      }
    }
  } else if (method === "POST" && url === "/items") {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", () => {
      const newItem = parse(body);
      if (newItem.name && newItem.price && newItem.size) {
        const data = loadData();
        const newId = data.length === 0 ? 1 : data[data.length - 1].id + 1;
        const item = {
          id: newId,
          name: newItem.name,
          price: parseFloat(newItem.price),
          size: newItem.size,
        };
        data.push(item);
        saveData(data);
        res.statusCode = 201;
        res.end(JSON.stringify(item));
      } else {
        res.statusCode = 400;
        res.end("Missing or invalid data");
      }
    });
  } else if (method === "PUT" && url.startsWith("/items/")) {
    const itemId = parseInt(url.split("/")[2]);

    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", () => {
      const updatedItem = parse(body);
      const data = loadData();
      const itemIndex = data.findIndex((item) => item.id === itemId);

      if (itemIndex !== -1) {
        const newItem = { ...data[itemIndex], ...updatedItem };
        data[itemIndex] = newItem;
        saveData(data);
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify(newItem));
      } else {
        res.statusCode = 404;
        res.end("Item not found");
      }
    });
  } else if (method === "DELETE" && url.startsWith("/items/")) {
    const itemId = parseInt(url.split("/")[2]);
    const data = loadData();
    const itemIndex = data.findIndex((item) => item.id === itemId);

    if (itemIndex !== -1) {
      const deletedItem = data.splice(itemIndex, 1)[0];
      saveData(data);
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(deletedItem));
    } else {
      res.statusCode = 404;
      res.end("Item not found");
    }
  } else {
    res.statusCode = 404;
    res.end("Endpoint not found");
  }
});

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
