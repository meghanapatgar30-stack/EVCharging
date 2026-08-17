/* =========================================================================
   EV Charge Backend Server
   -------------------------------------------------------------------------
   A simple Node.js + Express REST API.

   - No database (plain JavaScript arrays hold the data in memory)
   - No authentication, no login, no JWT
   - Just GET / POST / PUT / DELETE routes for stations and bookings

   Run with:
       npm install
       node server.js   (or  npm start)
   ========================================================================= */

const express = require("express");
const cors = require("cors");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

let stations = [
  {
    id: 1,
    name: "City EV Charging Hub",
    location: "Mangalore",
    distance: 2.5,
    totalChargers: 6,
    availableChargers: 4,
    chargingType: "DC Fast",
    pricePerKwh: 15,
    status: "Available"
  },
  {
    id: 2,
    name: "GreenVolt Station",
    location: "Bengaluru",
    distance: 5.1,
    totalChargers: 8,
    availableChargers: 0,
    chargingType: "AC",
    pricePerKwh: 10,
    status: "Busy"
  },
  {
    id: 3,
    name: "EV Power Point",
    location: "Mysuru",
    distance: 1.2,
    totalChargers: 4,
    availableChargers: 4,
    chargingType: "DC Fast",
    pricePerKwh: 16,
    status: "Available"
  },
  {
    id: 4,
    name: "Coastal Charge Station",
    location: "Udupi",
    distance: 3.8,
    totalChargers: 3,
    availableChargers: 1,
    chargingType: "AC",
    pricePerKwh: 9,
    status: "Available"
  },
  {
    id: 5,
    name: "Hubballi EV Junction",
    location: "Hubballi",
    distance: 7.4,
    totalChargers: 5,
    availableChargers: 0,
    chargingType: "DC Fast",
    pricePerKwh: 14,
    status: "Offline"
  },
  {
    id: 6,
    name: "Dharwad Fast Charge",
    location: "Dharwad",
    distance: 4.6,
    totalChargers: 4,
    availableChargers: 2,
    chargingType: "DC Fast",
    pricePerKwh: 15.5,
    status: "Available"
  }
];

let bookings = [
  {
    id: 1,
    stationId: 1,
    stationName: "City EV Charging Hub",
    chargerNumber: 2,
    date: "2026-08-20",
    time: "10:30",
    userName: "Rahul Shetty",
    status: "Confirmed"
  },
  {
    id: 2,
    stationId: 3,
    stationName: "EV Power Point",
    chargerNumber: 1,
    date: "2026-08-21",
    time: "15:00",
    userName: "Ayesha Khan",
    status: "Confirmed"
  },
  {
    id: 3,
    stationId: 4,
    stationName: "Coastal Charge Station",
    chargerNumber: 1,
    date: "2026-08-15",
    time: "09:00",
    userName: "Megha Rao",
    status: "Cancelled"
  }
];

let nextStationId = stations.length + 1;
let nextBookingId = bookings.length + 1;

function findStationById(id) {
  return stations.find((s) => s.id === id);
}

function findBookingById(id) {
  return bookings.find((b) => b.id === id);
}

app.get("/", (req, res) => {
  res.status(200).json({ message: "EV Charge Backend API is running" });
});

// GET /api/stations - get all stations
app.get("/api/stations", (req, res) => {
  res.status(200).json(stations);
});

// GET /api/stations/:id - get one station
app.get("/api/stations/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  const station = findStationById(id);

  if (!station) {
    return res.status(404).json({ message: "Station not found" });
  }

  res.status(200).json(station);
});

// POST /api/stations - create a new station
app.post("/api/stations", (req, res) => {
  const { name, location, distance, totalChargers, availableChargers, chargingType, pricePerKwh, status } = req.body || {};

  if (!name || !location || !chargingType) {
    return res.status(400).json({ message: "name, location and chargingType are required" });
  }
  if (totalChargers === undefined || pricePerKwh === undefined) {
    return res.status(400).json({ message: "totalChargers and pricePerKwh are required" });
  }

  const newStation = {
    id: nextStationId++,
    name,
    location,
    distance: distance !== undefined ? Number(distance) : 0,
    totalChargers: Number(totalChargers),
    availableChargers: availableChargers !== undefined ? Number(availableChargers) : Number(totalChargers),
    chargingType,
    pricePerKwh: Number(pricePerKwh),
    status: status || "Available"
  };

  stations.push(newStation);
  res.status(201).json({ message: "Station created successfully", station: newStation });
});

// PUT /api/stations/:id - update an existing station
app.put("/api/stations/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  const station = findStationById(id);

  if (!station) {
    return res.status(404).json({ message: "Station not found" });
  }

  const { name, location, distance, totalChargers, availableChargers, chargingType, pricePerKwh, status } = req.body || {};

  if (
    name === undefined &&
    location === undefined &&
    distance === undefined &&
    totalChargers === undefined &&
    availableChargers === undefined &&
    chargingType === undefined &&
    pricePerKwh === undefined &&
    status === undefined
  ) {
    return res.status(400).json({ message: "Provide at least one field to update" });
  }

  if (name !== undefined) station.name = name;
  if (location !== undefined) station.location = location;
  if (distance !== undefined) station.distance = Number(distance);
  if (totalChargers !== undefined) station.totalChargers = Number(totalChargers);
  if (availableChargers !== undefined) station.availableChargers = Number(availableChargers);
  if (chargingType !== undefined) station.chargingType = chargingType;
  if (pricePerKwh !== undefined) station.pricePerKwh = Number(pricePerKwh);
  if (status !== undefined) station.status = status;

  res.status(200).json({ message: "Station updated successfully", station });
});

// DELETE /api/stations/:id - delete a station
app.delete("/api/stations/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  const index = stations.findIndex((s) => s.id === id);

  if (index === -1) {
    return res.status(404).json({ message: "Station not found" });
  }

  const [deletedStation] = stations.splice(index, 1);
  res.status(200).json({ message: "Station deleted successfully", deletedStation });
});

// GET /api/bookings - get all bookings
app.get("/api/bookings", (req, res) => {
  res.status(200).json(bookings);
});

// GET /api/bookings/:id - get one booking
app.get("/api/bookings/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  const booking = findBookingById(id);

  if (!booking) {
    return res.status(404).json({ message: "Booking not found" });
  }

  res.status(200).json(booking);
});

// POST /api/bookings - create a new booking
app.post("/api/bookings", (req, res) => {
  const { stationId, chargerNumber, date, time, userName } = req.body || {};

  if (!stationId || !chargerNumber || !date || !time || !userName) {
    return res.status(400).json({ message: "stationId, chargerNumber, date, time and userName are required" });
  }

  const station = findStationById(Number(stationId));
  if (!station) {
    return res.status(404).json({ message: "Station not found" });
  }

  if (Number(chargerNumber) < 1 || Number(chargerNumber) > station.totalChargers) {
    return res.status(400).json({ message: `chargerNumber must be between 1 and ${station.totalChargers}` });
  }

  const newBooking = {
    id: nextBookingId++,
    stationId: station.id,
    stationName: station.name,
    chargerNumber: Number(chargerNumber),
    date,
    time,
    userName,
    status: "Confirmed"
  };

  bookings.push(newBooking);
  res.status(201).json({ message: "Booking created successfully", booking: newBooking });
});

// PUT /api/bookings/:id - update an existing booking
app.put("/api/bookings/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  const booking = findBookingById(id);

  if (!booking) {
    return res.status(404).json({ message: "Booking not found" });
  }

  const { chargerNumber, date, time, userName, status } = req.body || {};

  if (
    chargerNumber === undefined &&
    date === undefined &&
    time === undefined &&
    userName === undefined &&
    status === undefined
  ) {
    return res.status(400).json({ message: "Provide at least one field to update" });
  }

  if (chargerNumber !== undefined) booking.chargerNumber = Number(chargerNumber);
  if (date !== undefined) booking.date = date;
  if (time !== undefined) booking.time = time;
  if (userName !== undefined) booking.userName = userName;
  if (status !== undefined) booking.status = status;

  res.status(200).json({ message: "Booking updated successfully", booking });
});

// DELETE /api/bookings/:id - delete a booking
app.delete("/api/bookings/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  const index = bookings.findIndex((b) => b.id === id);

  if (index === -1) {
    return res.status(404).json({ message: "Booking not found" });
  }

  const [deletedBooking] = bookings.splice(index, 1);
  res.status(200).json({ message: "Booking deleted successfully", deletedBooking });
});

// Unknown route
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Catches unexpected errors so the server doesn't crash
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: "Something went wrong on the server" });
});

app.listen(PORT, () => {
  console.log(`EV Charge Backend Server running on http://localhost:${PORT}`);
});
