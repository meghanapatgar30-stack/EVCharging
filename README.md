# EV Charge Backend

A simple Node.js + Express REST API for the EV Charge Simple college project.

- No database — data lives in plain JavaScript arrays in memory
  (resets every time you restart the server).
- No authentication, no login, no JWT, no password system.
- Pure REST: GET, POST, PUT, DELETE for stations and bookings.

## How to run

```bash
cd backend
npm install
node server.js
```

or:

```bash
npm start
```

You should see:

```
EV Charge Backend Server running on http://localhost:5000
```

Then open a browser or Postman at `http://localhost:5000/` — you should see:

```json
{ "message": "EV Charge Backend API is running" }
```

## Running the frontend

Open `frontend/index.html` directly in your browser (double-click it, or
use VS Code's "Open with Live Server"). It calls the backend at
`http://localhost:5000`, so just make sure the backend is running first.
CORS is already enabled, so this works even though the frontend and
backend are on different origins/ports.

## Data models

**Station**
```json
{
  "id": 1,
  "name": "City EV Charging Hub",
  "location": "Mangalore",
  "distance": 2.5,
  "totalChargers": 6,
  "availableChargers": 4,
  "chargingType": "DC Fast",
  "pricePerKwh": 15,
  "status": "Available"
}
```

**Booking**
```json
{
  "id": 1,
  "stationId": 1,
  "stationName": "City EV Charging Hub",
  "chargerNumber": 2,
  "date": "2026-08-20",
  "time": "10:30",
  "userName": "Rahul Shetty",
  "status": "Confirmed"
}
```

---

## Testing in Postman

Base URL: `http://localhost:5000`

No headers, no auth, no Bearer tokens needed anywhere — just set
`Content-Type: application/json` for POST/PUT requests with a body
(Postman does this automatically when you choose Body → raw → JSON).

### 1. GET all stations
- **Method:** GET
- **URL:** `http://localhost:5000/api/stations`
- **Body:** none
- **Expected response:** `200 OK` + a JSON array of all stations

### 2. GET station by ID
- **Method:** GET
- **URL:** `http://localhost:5000/api/stations/1`
- **Body:** none
- **Expected response:** `200 OK` + one station object
- Try `http://localhost:5000/api/stations/999` → `404 Not Found`,
  `{ "message": "Station not found" }`

### 3. POST a new station
- **Method:** POST
- **URL:** `http://localhost:5000/api/stations`
- **Body → raw → JSON:**
```json
{
  "name": "New EV Station",
  "location": "Mangalore",
  "distance": 3.2,
  "totalChargers": 4,
  "availableChargers": 3,
  "chargingType": "AC",
  "pricePerKwh": 12,
  "status": "Available"
}
```
- **Expected response:** `201 Created` +
```json
{ "message": "Station created successfully", "station": { "id": 7, ... } }
```

### 4. PUT (update) a station
- **Method:** PUT
- **URL:** `http://localhost:5000/api/stations/1`
- **Body → raw → JSON:**
```json
{
  "availableChargers": 2,
  "status": "Busy"
}
```
- **Expected response:** `200 OK` + the updated station
- Try a non-existent id (e.g. `/api/stations/999`) → `404 Not Found`

### 5. DELETE a station
- **Method:** DELETE
- **URL:** `http://localhost:5000/api/stations/7` (use an id that exists)
- **Body:** none
- **Expected response:** `200 OK` +
```json
{ "message": "Station deleted successfully", "deletedStation": { ... } }
```
- Try deleting the same id again → `404 Not Found`,
  `{ "message": "Station not found" }`

### 6. GET all bookings
- **Method:** GET
- **URL:** `http://localhost:5000/api/bookings`
- **Body:** none
- **Expected response:** `200 OK` + a JSON array of all bookings

### 7. POST a new booking
- **Method:** POST
- **URL:** `http://localhost:5000/api/bookings`
- **Body → raw → JSON:**
```json
{
  "stationId": 1,
  "chargerNumber": 3,
  "date": "2026-09-01",
  "time": "11:00",
  "userName": "Test Student"
}
```
- **Expected response:** `201 Created` +
```json
{ "message": "Booking created successfully", "booking": { "id": 4, ... } }
```
- Try a `stationId` that doesn't exist → `404 Not Found`
- Try leaving out `userName` → `400 Bad Request`

### 8. PUT (update) a booking
- **Method:** PUT
- **URL:** `http://localhost:5000/api/bookings/1`
- **Body → raw → JSON:**
```json
{
  "time": "12:30",
  "status": "Confirmed"
}
```
- **Expected response:** `200 OK` + the updated booking

### 9. DELETE a booking
- **Method:** DELETE
- **URL:** `http://localhost:5000/api/bookings/1`
- **Body:** none
- **Expected response:** `200 OK` +
```json
{ "message": "Booking deleted successfully", "deletedBooking": { ... } }
```

---

## Status codes used

| Code | Meaning |
|------|---------|
| 200  | Successful GET / PUT / DELETE |
| 201  | Successful POST (resource created) |
| 400  | Invalid input (missing/bad fields) |
| 404  | Station or booking not found |
| 500  | Unexpected server error |

## Project structure

```
EV-Charge-Simple/
│
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── script.js
│
└── backend/
    ├── server.js
    ├── package.json
    └── README.md
```
