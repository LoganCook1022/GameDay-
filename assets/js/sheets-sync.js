/**
 * GameDay+ - Google Sheets Sync & Data Engine
 * Synchronized with Sugar-Salem High School (Diggers) Athletics & Calendars
 * Source: https://hs.sugarsalem.org/sportscalendars & ArbiterLive ID 22686
 */

const SheetsSync = (function() {
  const STORAGE_KEY_SHEET_URL = 'gameday_sheet_url';
  const STORAGE_KEY_CUSTOM_DATA = 'gameday_cached_events';
  const DEFAULT_LIVE_DATA_URL = './data/events.json';
  const DEFAULT_SHEET_URL = DEFAULT_LIVE_DATA_URL;

  const snakeRiverGames = [
  {
    "id": "sr-1",
    "sport": "Football",
    "gender": "Boys",
    "level": "Varsity",
    "opponent": "Football Event",
    "opponentMascot": "",
    "locationType": "Home",
    "date": "2026-08-01",
    "time": "12:00 AM",
    "venueName": "Snake River High School",
    "venueAddress": "922 W Hwy 39, Blackfoot, ID 83221",
    "lat": 43.1904,
    "lng": -112.3456,
    "parkingInfo": "Standard spectator parking available.",
    "ticketUrl": "https://sugarsalemhighschool.arbiterwebsites.com/",
    "ourScore": null,
    "oppScore": null,
    "status": "Upcoming",
    "highlights": "",
    "stats": null,
    "schoolId": "snake-river"
  },
  {
    "id": "sr-2",
    "sport": "Volleyball",
    "gender": "Girls",
    "level": "Varsity",
    "opponent": "Volleyball Event",
    "opponentMascot": "",
    "locationType": "Home",
    "date": "2026-08-02",
    "time": "12:00 AM",
    "venueName": "Snake River High School",
    "venueAddress": "922 W Hwy 39, Blackfoot, ID 83221",
    "lat": 43.1904,
    "lng": -112.3456,
    "parkingInfo": "Standard spectator parking available.",
    "ticketUrl": "https://sugarsalemhighschool.arbiterwebsites.com/",
    "ourScore": null,
    "oppScore": null,
    "status": "Upcoming",
    "highlights": "",
    "stats": null,
    "schoolId": "snake-river"
  },
  {
    "id": "sr-3",
    "sport": "Volleyball",
    "gender": "Girls",
    "level": "Varsity",
    "opponent": "Volleyball Event",
    "opponentMascot": "",
    "locationType": "Home",
    "date": "2026-08-03",
    "time": "12:00 AM",
    "venueName": "Snake River High School",
    "venueAddress": "922 W Hwy 39, Blackfoot, ID 83221",
    "lat": 43.1904,
    "lng": -112.3456,
    "parkingInfo": "Standard spectator parking available.",
    "ticketUrl": "https://sugarsalemhighschool.arbiterwebsites.com/",
    "ourScore": null,
    "oppScore": null,
    "status": "Upcoming",
    "highlights": "",
    "stats": null,
    "schoolId": "snake-river"
  },
  {
    "id": "sr-4",
    "sport": "Volleyball",
    "gender": "Girls",
    "level": "Varsity",
    "opponent": "Fruitland High School",
    "opponentMascot": "",
    "locationType": "Home",
    "date": "2026-08-04",
    "time": "10:00 AM",
    "venueName": "Snake River High School",
    "venueAddress": "922 W Hwy 39, Blackfoot, ID 83221",
    "lat": 43.1904,
    "lng": -112.3456,
    "parkingInfo": "Standard spectator parking available.",
    "ticketUrl": "https://sugarsalemhighschool.arbiterwebsites.com/",
    "ourScore": null,
    "oppScore": null,
    "status": "Upcoming",
    "highlights": "",
    "stats": null,
    "schoolId": "snake-river"
  },
  {
    "id": "sr-5",
    "sport": "Soccer",
    "gender": "Girls",
    "level": "Varsity",
    "opponent": "Meridian Senior High School",
    "opponentMascot": "",
    "locationType": "Away",
    "date": "2026-08-05",
    "time": "1:00 PM",
    "venueName": "Meridian Senior High School Stadium",
    "venueAddress": "Meridian Senior High School, ID",
    "lat": 43.8744,
    "lng": -111.7483,
    "parkingInfo": "Standard spectator parking available.",
    "ticketUrl": "https://sugarsalemhighschool.arbiterwebsites.com/",
    "ourScore": null,
    "oppScore": null,
    "status": "Upcoming",
    "highlights": "",
    "stats": null,
    "schoolId": "snake-river"
  },
  {
    "id": "sr-6",
    "sport": "Football",
    "gender": "Boys",
    "level": "Junior Varsity",
    "opponent": "Homedale High School",
    "opponentMascot": "",
    "locationType": "Away",
    "date": "2026-08-06",
    "time": "1:00 PM",
    "venueName": "Homedale High School Stadium",
    "venueAddress": "Homedale High School, ID",
    "lat": 43.8744,
    "lng": -111.7483,
    "parkingInfo": "Standard spectator parking available.",
    "ticketUrl": "https://sugarsalemhighschool.arbiterwebsites.com/",
    "ourScore": null,
    "oppScore": null,
    "status": "Upcoming",
    "highlights": "",
    "stats": null,
    "schoolId": "snake-river"
  },
  {
    "id": "sr-7",
    "sport": "Soccer",
    "gender": "Boys",
    "level": "Varsity",
    "opponent": "Meridian Senior High School",
    "opponentMascot": "",
    "locationType": "Away",
    "date": "2026-08-07",
    "time": "3:00 PM",
    "venueName": "Meridian Senior High School Stadium",
    "venueAddress": "Meridian Senior High School, ID",
    "lat": 43.8744,
    "lng": -111.7483,
    "parkingInfo": "Standard spectator parking available.",
    "ticketUrl": "https://sugarsalemhighschool.arbiterwebsites.com/",
    "ourScore": null,
    "oppScore": null,
    "status": "Upcoming",
    "highlights": "",
    "stats": null,
    "schoolId": "snake-river"
  },
  {
    "id": "sr-8",
    "sport": "Football",
    "gender": "Boys",
    "level": "Varsity",
    "opponent": "Homedale High School",
    "opponentMascot": "",
    "locationType": "Away",
    "date": "2026-08-08",
    "time": "4:00 PM",
    "venueName": "Homedale High School Stadium",
    "venueAddress": "Homedale High School, ID",
    "lat": 43.8744,
    "lng": -111.7483,
    "parkingInfo": "Standard spectator parking available.",
    "ticketUrl": "https://sugarsalemhighschool.arbiterwebsites.com/",
    "ourScore": null,
    "oppScore": null,
    "status": "Upcoming",
    "highlights": "",
    "stats": null,
    "schoolId": "snake-river"
  },
  {
    "id": "sr-9",
    "sport": "Cross Country",
    "gender": "Coed",
    "level": "Varsity",
    "opponent": "Cross Country Event",
    "opponentMascot": "",
    "locationType": "Home",
    "date": "2026-08-09",
    "time": "TBA",
    "venueName": "Snake River High School",
    "venueAddress": "922 W Hwy 39, Blackfoot, ID 83221",
    "lat": 43.1904,
    "lng": -112.3456,
    "parkingInfo": "Standard spectator parking available.",
    "ticketUrl": "https://sugarsalemhighschool.arbiterwebsites.com/",
    "ourScore": null,
    "oppScore": null,
    "status": "Upcoming",
    "highlights": "",
    "stats": null,
    "schoolId": "snake-river"
  },
  {
    "id": "sr-10",
    "sport": "Soccer",
    "gender": "Girls",
    "level": "Varsity",
    "opponent": "Canyon Ridge High School",
    "opponentMascot": "",
    "locationType": "Home",
    "date": "2026-08-10",
    "time": "11:00 AM",
    "venueName": "Snake River High School",
    "venueAddress": "922 W Hwy 39, Blackfoot, ID 83221",
    "lat": 43.1904,
    "lng": -112.3456,
    "parkingInfo": "Standard spectator parking available.",
    "ticketUrl": "https://sugarsalemhighschool.arbiterwebsites.com/",
    "ourScore": null,
    "oppScore": null,
    "status": "Upcoming",
    "highlights": "",
    "stats": null,
    "schoolId": "snake-river"
  },
  {
    "id": "sr-11",
    "sport": "Volleyball",
    "gender": "Girls",
    "level": "C-Team",
    "opponent": "Filer High School",
    "opponentMascot": "",
    "locationType": "Home",
    "date": "2026-08-11",
    "time": "4:30 PM",
    "venueName": "Snake River High School",
    "venueAddress": "922 W Hwy 39, Blackfoot, ID 83221",
    "lat": 43.1904,
    "lng": -112.3456,
    "parkingInfo": "Standard spectator parking available.",
    "ticketUrl": "https://sugarsalemhighschool.arbiterwebsites.com/",
    "ourScore": null,
    "oppScore": null,
    "status": "Upcoming",
    "highlights": "",
    "stats": null,
    "schoolId": "snake-river"
  },
  {
    "id": "sr-12",
    "sport": "Volleyball",
    "gender": "Girls",
    "level": "C-Team",
    "opponent": "Blackfoot High School",
    "opponentMascot": "",
    "locationType": "Home",
    "date": "2026-08-12",
    "time": "4:30 PM",
    "venueName": "Snake River High School",
    "venueAddress": "922 W Hwy 39, Blackfoot, ID 83221",
    "lat": 43.1904,
    "lng": -112.3456,
    "parkingInfo": "Standard spectator parking available.",
    "ticketUrl": "https://sugarsalemhighschool.arbiterwebsites.com/",
    "ourScore": null,
    "oppScore": null,
    "status": "Upcoming",
    "highlights": "",
    "stats": null,
    "schoolId": "snake-river"
  },
  {
    "id": "sr-13",
    "sport": "Football",
    "gender": "Boys",
    "level": "Varsity",
    "opponent": "Snake River High School",
    "opponentMascot": "",
    "locationType": "Away",
    "date": "2026-08-13",
    "time": "7:00 PM",
    "venueName": "Snake River High School Stadium",
    "venueAddress": "Snake River High School, ID",
    "lat": 43.8744,
    "lng": -111.7483,
    "parkingInfo": "Standard spectator parking available.",
    "ticketUrl": "https://sugarsalemhighschool.arbiterwebsites.com/",
    "ourScore": null,
    "oppScore": null,
    "status": "Upcoming",
    "highlights": "",
    "stats": null,
    "schoolId": "snake-river"
  },
  {
    "id": "sr-14",
    "sport": "Soccer",
    "gender": "Girls",
    "level": "Varsity",
    "opponent": "Marsh Valley High School",
    "opponentMascot": "",
    "locationType": "Away",
    "date": "2026-08-14",
    "time": "4:00 PM",
    "venueName": "Marsh Valley High School Stadium",
    "venueAddress": "Marsh Valley High School, ID",
    "lat": 43.8744,
    "lng": -111.7483,
    "parkingInfo": "Standard spectator parking available.",
    "ticketUrl": "https://sugarsalemhighschool.arbiterwebsites.com/",
    "ourScore": null,
    "oppScore": null,
    "status": "Upcoming",
    "highlights": "",
    "stats": null,
    "schoolId": "snake-river"
  },
  {
    "id": "sr-15",
    "sport": "Volleyball",
    "gender": "Girls",
    "level": "Junior Varsity",
    "opponent": "Filer High School",
    "opponentMascot": "",
    "locationType": "Home",
    "date": "2026-08-15",
    "time": "5:30 PM",
    "venueName": "Snake River High School",
    "venueAddress": "922 W Hwy 39, Blackfoot, ID 83221",
    "lat": 43.1904,
    "lng": -112.3456,
    "parkingInfo": "Standard spectator parking available.",
    "ticketUrl": "https://sugarsalemhighschool.arbiterwebsites.com/",
    "ourScore": null,
    "oppScore": null,
    "status": "Upcoming",
    "highlights": "",
    "stats": null,
    "schoolId": "snake-river"
  },
  {
    "id": "sr-16",
    "sport": "Volleyball",
    "gender": "Girls",
    "level": "Junior Varsity",
    "opponent": "Blackfoot High School",
    "opponentMascot": "",
    "locationType": "Home",
    "date": "2026-08-16",
    "time": "5:30 PM",
    "venueName": "Snake River High School",
    "venueAddress": "922 W Hwy 39, Blackfoot, ID 83221",
    "lat": 43.1904,
    "lng": -112.3456,
    "parkingInfo": "Standard spectator parking available.",
    "ticketUrl": "https://sugarsalemhighschool.arbiterwebsites.com/",
    "ourScore": null,
    "oppScore": null,
    "status": "Upcoming",
    "highlights": "",
    "stats": null,
    "schoolId": "snake-river"
  },
  {
    "id": "sr-17",
    "sport": "Football",
    "gender": "Boys",
    "level": "Freshman",
    "opponent": "Snake River High School",
    "opponentMascot": "",
    "locationType": "Home",
    "date": "2026-08-17",
    "time": "4:30 PM",
    "venueName": "Snake River High School",
    "venueAddress": "922 W Hwy 39, Blackfoot, ID 83221",
    "lat": 43.1904,
    "lng": -112.3456,
    "parkingInfo": "Standard spectator parking available.",
    "ticketUrl": "https://sugarsalemhighschool.arbiterwebsites.com/",
    "ourScore": null,
    "oppScore": null,
    "status": "Upcoming",
    "highlights": "",
    "stats": null,
    "schoolId": "snake-river"
  },
  {
    "id": "sr-18",
    "sport": "Soccer",
    "gender": "Boys",
    "level": "Varsity",
    "opponent": "American Falls High School",
    "opponentMascot": "",
    "locationType": "Home",
    "date": "2026-08-18",
    "time": "7:00 PM",
    "venueName": "Snake River High School",
    "venueAddress": "922 W Hwy 39, Blackfoot, ID 83221",
    "lat": 43.1904,
    "lng": -112.3456,
    "parkingInfo": "Standard spectator parking available.",
    "ticketUrl": "https://sugarsalemhighschool.arbiterwebsites.com/",
    "ourScore": null,
    "oppScore": null,
    "status": "Upcoming",
    "highlights": "",
    "stats": null,
    "schoolId": "snake-river"
  },
  {
    "id": "sr-19",
    "sport": "Volleyball",
    "gender": "Girls",
    "level": "Varsity",
    "opponent": "Blackfoot High School",
    "opponentMascot": "",
    "locationType": "Home",
    "date": "2026-08-19",
    "time": "7:00 PM",
    "venueName": "Snake River High School",
    "venueAddress": "922 W Hwy 39, Blackfoot, ID 83221",
    "lat": 43.1904,
    "lng": -112.3456,
    "parkingInfo": "Standard spectator parking available.",
    "ticketUrl": "https://sugarsalemhighschool.arbiterwebsites.com/",
    "ourScore": null,
    "oppScore": null,
    "status": "Upcoming",
    "highlights": "",
    "stats": null,
    "schoolId": "snake-river"
  },
  {
    "id": "sr-20",
    "sport": "Soccer",
    "gender": "Boys",
    "level": "Varsity",
    "opponent": "Marsh Valley High School",
    "opponentMascot": "",
    "locationType": "Away",
    "date": "2026-08-20",
    "time": "6:00 PM",
    "venueName": "Marsh Valley High School Stadium",
    "venueAddress": "Marsh Valley High School, ID",
    "lat": 43.8744,
    "lng": -111.7483,
    "parkingInfo": "Standard spectator parking available.",
    "ticketUrl": "https://sugarsalemhighschool.arbiterwebsites.com/",
    "ourScore": null,
    "oppScore": null,
    "status": "Upcoming",
    "highlights": "",
    "stats": null,
    "schoolId": "snake-river"
  },
  {
    "id": "sr-21",
    "sport": "Volleyball",
    "gender": "Girls",
    "level": "Varsity",
    "opponent": "Filer High School",
    "opponentMascot": "",
    "locationType": "Home",
    "date": "2026-08-21",
    "time": "7:00 PM",
    "venueName": "Snake River High School",
    "venueAddress": "922 W Hwy 39, Blackfoot, ID 83221",
    "lat": 43.1904,
    "lng": -112.3456,
    "parkingInfo": "Standard spectator parking available.",
    "ticketUrl": "https://sugarsalemhighschool.arbiterwebsites.com/",
    "ourScore": null,
    "oppScore": null,
    "status": "Upcoming",
    "highlights": "",
    "stats": null,
    "schoolId": "snake-river"
  },
  {
    "id": "sr-22",
    "sport": "Football",
    "gender": "Boys",
    "level": "Junior Varsity",
    "opponent": "Snake River High School",
    "opponentMascot": "",
    "locationType": "Home",
    "date": "2026-08-22",
    "time": "7:00 PM",
    "venueName": "Snake River High School",
    "venueAddress": "922 W Hwy 39, Blackfoot, ID 83221",
    "lat": 43.1904,
    "lng": -112.3456,
    "parkingInfo": "Standard spectator parking available.",
    "ticketUrl": "https://sugarsalemhighschool.arbiterwebsites.com/",
    "ourScore": null,
    "oppScore": null,
    "status": "Upcoming",
    "highlights": "",
    "stats": null,
    "schoolId": "snake-river"
  },
  {
    "id": "sr-23",
    "sport": "Soccer",
    "gender": "Girls",
    "level": "Varsity",
    "opponent": "Marsh Valley High School",
    "opponentMascot": "",
    "locationType": "Home",
    "date": "2026-08-23",
    "time": "3:00 PM",
    "venueName": "Snake River High School",
    "venueAddress": "922 W Hwy 39, Blackfoot, ID 83221",
    "lat": 43.1904,
    "lng": -112.3456,
    "parkingInfo": "Standard spectator parking available.",
    "ticketUrl": "https://sugarsalemhighschool.arbiterwebsites.com/",
    "ourScore": null,
    "oppScore": null,
    "status": "Upcoming",
    "highlights": "",
    "stats": null,
    "schoolId": "snake-river"
  },
  {
    "id": "sr-24",
    "sport": "Volleyball",
    "gender": "Girls",
    "level": "C-Team",
    "opponent": "Snake River High School",
    "opponentMascot": "",
    "locationType": "Away",
    "date": "2026-08-24",
    "time": "4:30 PM",
    "venueName": "Snake River High School Stadium",
    "venueAddress": "Snake River High School, ID",
    "lat": 43.8744,
    "lng": -111.7483,
    "parkingInfo": "Standard spectator parking available.",
    "ticketUrl": "https://sugarsalemhighschool.arbiterwebsites.com/",
    "ourScore": null,
    "oppScore": null,
    "status": "Upcoming",
    "highlights": "",
    "stats": null,
    "schoolId": "snake-river"
  },
  {
    "id": "sr-25",
    "sport": "Football",
    "gender": "Boys",
    "level": "Freshman",
    "opponent": "Shelley High School",
    "opponentMascot": "",
    "locationType": "Home",
    "date": "2026-08-25",
    "time": "4:30 PM",
    "venueName": "Snake River High School",
    "venueAddress": "922 W Hwy 39, Blackfoot, ID 83221",
    "lat": 43.1904,
    "lng": -112.3456,
    "parkingInfo": "Standard spectator parking available.",
    "ticketUrl": "https://sugarsalemhighschool.arbiterwebsites.com/",
    "ourScore": null,
    "oppScore": null,
    "status": "Upcoming",
    "highlights": "",
    "stats": null,
    "schoolId": "snake-river"
  },
  {
    "id": "sr-26",
    "sport": "Soccer",
    "gender": "Girls",
    "level": "Varsity",
    "opponent": "Idaho Falls High School",
    "opponentMascot": "",
    "locationType": "Home",
    "date": "2026-08-26",
    "time": "5:00 PM",
    "venueName": "Snake River High School",
    "venueAddress": "922 W Hwy 39, Blackfoot, ID 83221",
    "lat": 43.1904,
    "lng": -112.3456,
    "parkingInfo": "Standard spectator parking available.",
    "ticketUrl": "https://sugarsalemhighschool.arbiterwebsites.com/",
    "ourScore": null,
    "oppScore": null,
    "status": "Upcoming",
    "highlights": "",
    "stats": null,
    "schoolId": "snake-river"
  },
  {
    "id": "sr-27",
    "sport": "Soccer",
    "gender": "Girls",
    "level": "Varsity",
    "opponent": "South Fremont High School",
    "opponentMascot": "",
    "locationType": "Home",
    "date": "2026-08-27",
    "time": "5:00 PM",
    "venueName": "Snake River High School",
    "venueAddress": "922 W Hwy 39, Blackfoot, ID 83221",
    "lat": 43.1904,
    "lng": -112.3456,
    "parkingInfo": "Standard spectator parking available.",
    "ticketUrl": "https://sugarsalemhighschool.arbiterwebsites.com/",
    "ourScore": null,
    "oppScore": null,
    "status": "Upcoming",
    "highlights": "",
    "stats": null,
    "schoolId": "snake-river"
  },
  {
    "id": "sr-28",
    "sport": "Soccer",
    "gender": "Boys",
    "level": "Varsity",
    "opponent": "Marsh Valley High School",
    "opponentMascot": "",
    "locationType": "Home",
    "date": "2026-08-28",
    "time": "5:00 PM",
    "venueName": "Snake River High School",
    "venueAddress": "922 W Hwy 39, Blackfoot, ID 83221",
    "lat": 43.1904,
    "lng": -112.3456,
    "parkingInfo": "Standard spectator parking available.",
    "ticketUrl": "https://sugarsalemhighschool.arbiterwebsites.com/",
    "ourScore": null,
    "oppScore": null,
    "status": "Upcoming",
    "highlights": "",
    "stats": null,
    "schoolId": "snake-river"
  },
  {
    "id": "sr-29",
    "sport": "Volleyball",
    "gender": "Girls",
    "level": "Junior Varsity",
    "opponent": "Snake River High School",
    "opponentMascot": "",
    "locationType": "Away",
    "date": "2026-08-28",
    "time": "5:30 PM",
    "venueName": "Snake River High School Stadium",
    "venueAddress": "Snake River High School, ID",
    "lat": 43.8744,
    "lng": -111.7483,
    "parkingInfo": "Standard spectator parking available.",
    "ticketUrl": "https://sugarsalemhighschool.arbiterwebsites.com/",
    "ourScore": null,
    "oppScore": null,
    "status": "Upcoming",
    "highlights": "",
    "stats": null,
    "schoolId": "snake-river"
  },
  {
    "id": "sr-30",
    "sport": "Soccer",
    "gender": "Boys",
    "level": "Varsity",
    "opponent": "South Fremont High School",
    "opponentMascot": "",
    "locationType": "Home",
    "date": "2026-08-28",
    "time": "7:00 PM",
    "venueName": "Snake River High School",
    "venueAddress": "922 W Hwy 39, Blackfoot, ID 83221",
    "lat": 43.1904,
    "lng": -112.3456,
    "parkingInfo": "Standard spectator parking available.",
    "ticketUrl": "https://sugarsalemhighschool.arbiterwebsites.com/",
    "ourScore": null,
    "oppScore": null,
    "status": "Upcoming",
    "highlights": "",
    "stats": null,
    "schoolId": "snake-river"
  },
  {
    "id": "sr-31",
    "sport": "Football",
    "gender": "Boys",
    "level": "Varsity",
    "opponent": "Shelley High School",
    "opponentMascot": "",
    "locationType": "Away",
    "date": "2026-08-28",
    "time": "7:00 PM",
    "venueName": "Shelley High School Stadium",
    "venueAddress": "Shelley High School, ID",
    "lat": 43.8744,
    "lng": -111.7483,
    "parkingInfo": "Standard spectator parking available.",
    "ticketUrl": "https://sugarsalemhighschool.arbiterwebsites.com/",
    "ourScore": null,
    "oppScore": null,
    "status": "Upcoming",
    "highlights": "",
    "stats": null,
    "schoolId": "snake-river"
  },
  {
    "id": "sr-32",
    "sport": "Volleyball",
    "gender": "Girls",
    "level": "Varsity",
    "opponent": "Snake River High School",
    "opponentMascot": "",
    "locationType": "Away",
    "date": "2026-08-28",
    "time": "7:00 PM",
    "venueName": "Snake River High School Stadium",
    "venueAddress": "Snake River High School, ID",
    "lat": 43.8744,
    "lng": -111.7483,
    "parkingInfo": "Standard spectator parking available.",
    "ticketUrl": "https://sugarsalemhighschool.arbiterwebsites.com/",
    "ourScore": null,
    "oppScore": null,
    "status": "Upcoming",
    "highlights": "",
    "stats": null,
    "schoolId": "snake-river"
  },
  {
    "id": "sr-33",
    "sport": "Football",
    "gender": "Boys",
    "level": "Junior Varsity",
    "opponent": "Idaho Falls High School",
    "opponentMascot": "",
    "locationType": "Home",
    "date": "2026-08-28",
    "time": "7:00 PM",
    "venueName": "Snake River High School",
    "venueAddress": "922 W Hwy 39, Blackfoot, ID 83221",
    "lat": 43.1904,
    "lng": -112.3456,
    "parkingInfo": "Standard spectator parking available.",
    "ticketUrl": "https://sugarsalemhighschool.arbiterwebsites.com/",
    "ourScore": null,
    "oppScore": null,
    "status": "Upcoming",
    "highlights": "",
    "stats": null,
    "schoolId": "snake-river"
  },
  {
    "id": "sr-34",
    "sport": "Soccer",
    "gender": "Girls",
    "level": "Varsity",
    "opponent": "Preston High School",
    "opponentMascot": "",
    "locationType": "Away",
    "date": "2026-10-01",
    "time": "3:00 PM",
    "venueName": "Preston High School Stadium",
    "venueAddress": "Preston High School, ID",
    "lat": 43.8744,
    "lng": -111.7483,
    "parkingInfo": "Standard spectator parking available.",
    "ticketUrl": "https://sugarsalemhighschool.arbiterwebsites.com/",
    "ourScore": null,
    "oppScore": null,
    "status": "Upcoming",
    "highlights": "",
    "stats": null,
    "schoolId": "snake-river"
  },
  {
    "id": "sr-35",
    "sport": "Football",
    "gender": "Boys",
    "level": "Freshman",
    "opponent": "Highland High School (ID)",
    "opponentMascot": "",
    "locationType": "Home",
    "date": "2026-10-02",
    "time": "4:30 PM",
    "venueName": "Snake River High School",
    "venueAddress": "922 W Hwy 39, Blackfoot, ID 83221",
    "lat": 43.1904,
    "lng": -112.3456,
    "parkingInfo": "Standard spectator parking available.",
    "ticketUrl": "https://sugarsalemhighschool.arbiterwebsites.com/",
    "ourScore": null,
    "oppScore": null,
    "status": "Upcoming",
    "highlights": "",
    "stats": null,
    "schoolId": "snake-river"
  },
  {
    "id": "sr-36",
    "sport": "Volleyball",
    "gender": "Girls",
    "level": "C-Team",
    "opponent": "Malad High School",
    "opponentMascot": "",
    "locationType": "Away",
    "date": "2026-10-03",
    "time": "4:30 PM",
    "venueName": "Malad High School Stadium",
    "venueAddress": "Malad High School, ID",
    "lat": 43.8744,
    "lng": -111.7483,
    "parkingInfo": "Standard spectator parking available.",
    "ticketUrl": "https://sugarsalemhighschool.arbiterwebsites.com/",
    "ourScore": null,
    "oppScore": null,
    "status": "Upcoming",
    "highlights": "",
    "stats": null,
    "schoolId": "snake-river"
  },
  {
    "id": "sr-37",
    "sport": "Soccer",
    "gender": "Boys",
    "level": "Varsity",
    "opponent": "Preston High School",
    "opponentMascot": "",
    "locationType": "Away",
    "date": "2026-10-04",
    "time": "5:00 PM",
    "venueName": "Preston High School Stadium",
    "venueAddress": "Preston High School, ID",
    "lat": 43.8744,
    "lng": -111.7483,
    "parkingInfo": "Standard spectator parking available.",
    "ticketUrl": "https://sugarsalemhighschool.arbiterwebsites.com/",
    "ourScore": null,
    "oppScore": null,
    "status": "Upcoming",
    "highlights": "",
    "stats": null,
    "schoolId": "snake-river"
  },
  {
    "id": "sr-38",
    "sport": "Volleyball",
    "gender": "Girls",
    "level": "Junior Varsity",
    "opponent": "Malad High School",
    "opponentMascot": "",
    "locationType": "Away",
    "date": "2026-10-05",
    "time": "5:30 PM",
    "venueName": "Malad High School Stadium",
    "venueAddress": "Malad High School, ID",
    "lat": 43.8744,
    "lng": -111.7483,
    "parkingInfo": "Standard spectator parking available.",
    "ticketUrl": "https://sugarsalemhighschool.arbiterwebsites.com/",
    "ourScore": null,
    "oppScore": null,
    "status": "Upcoming",
    "highlights": "",
    "stats": null,
    "schoolId": "snake-river"
  },
  {
    "id": "sr-39",
    "sport": "Football",
    "gender": "Boys",
    "level": "Junior Varsity",
    "opponent": "Century High School",
    "opponentMascot": "",
    "locationType": "Home",
    "date": "2026-10-06",
    "time": "7:00 PM",
    "venueName": "Snake River High School",
    "venueAddress": "922 W Hwy 39, Blackfoot, ID 83221",
    "lat": 43.1904,
    "lng": -112.3456,
    "parkingInfo": "Standard spectator parking available.",
    "ticketUrl": "https://sugarsalemhighschool.arbiterwebsites.com/",
    "ourScore": null,
    "oppScore": null,
    "status": "Upcoming",
    "highlights": "",
    "stats": null,
    "schoolId": "snake-river"
  },
  {
    "id": "sr-40",
    "sport": "Volleyball",
    "gender": "Girls",
    "level": "Varsity",
    "opponent": "Malad High School",
    "opponentMascot": "",
    "locationType": "Away",
    "date": "2026-10-07",
    "time": "7:00 PM",
    "venueName": "Malad High School Stadium",
    "venueAddress": "Malad High School, ID",
    "lat": 43.8744,
    "lng": -111.7483,
    "parkingInfo": "Standard spectator parking available.",
    "ticketUrl": "https://sugarsalemhighschool.arbiterwebsites.com/",
    "ourScore": null,
    "oppScore": null,
    "status": "Upcoming",
    "highlights": "",
    "stats": null,
    "schoolId": "snake-river"
  },
  {
    "id": "sr-41",
    "sport": "Volleyball",
    "gender": "Girls",
    "level": "Junior Varsity",
    "opponent": "Volleyball Event",
    "opponentMascot": "",
    "locationType": "Home",
    "date": "2026-10-08",
    "time": "TBA",
    "venueName": "Snake River High School",
    "venueAddress": "922 W Hwy 39, Blackfoot, ID 83221",
    "lat": 43.1904,
    "lng": -112.3456,
    "parkingInfo": "Standard spectator parking available.",
    "ticketUrl": "https://sugarsalemhighschool.arbiterwebsites.com/",
    "ourScore": null,
    "oppScore": null,
    "status": "Upcoming",
    "highlights": "",
    "stats": null,
    "schoolId": "snake-river"
  },
  {
    "id": "sr-42",
    "sport": "Soccer",
    "gender": "Girls",
    "level": "Varsity",
    "opponent": "Soccer Event",
    "opponentMascot": "",
    "locationType": "Home",
    "date": "2026-10-09",
    "time": "TBA",
    "venueName": "Snake River High School",
    "venueAddress": "922 W Hwy 39, Blackfoot, ID 83221",
    "lat": 43.1904,
    "lng": -112.3456,
    "parkingInfo": "Standard spectator parking available.",
    "ticketUrl": "https://sugarsalemhighschool.arbiterwebsites.com/",
    "ourScore": null,
    "oppScore": null,
    "status": "Upcoming",
    "highlights": "",
    "stats": null,
    "schoolId": "snake-river"
  },
  {
    "id": "sr-43",
    "sport": "Soccer",
    "gender": "Girls",
    "level": "Varsity",
    "opponent": "Firth High School",
    "opponentMascot": "",
    "locationType": "Away",
    "date": "2026-10-10",
    "time": "4:00 PM",
    "venueName": "Firth High School Stadium",
    "venueAddress": "Firth High School, ID",
    "lat": 43.8744,
    "lng": -111.7483,
    "parkingInfo": "Standard spectator parking available.",
    "ticketUrl": "https://sugarsalemhighschool.arbiterwebsites.com/",
    "ourScore": null,
    "oppScore": null,
    "status": "Upcoming",
    "highlights": "",
    "stats": null,
    "schoolId": "snake-river"
  },
  {
    "id": "sr-44",
    "sport": "Volleyball",
    "gender": "Girls",
    "level": "Junior Varsity",
    "opponent": "Volleyball Event",
    "opponentMascot": "",
    "locationType": "Home",
    "date": "2026-10-11",
    "time": "5:30 PM",
    "venueName": "Snake River High School",
    "venueAddress": "922 W Hwy 39, Blackfoot, ID 83221",
    "lat": 43.1904,
    "lng": -112.3456,
    "parkingInfo": "Standard spectator parking available.",
    "ticketUrl": "https://sugarsalemhighschool.arbiterwebsites.com/",
    "ourScore": null,
    "oppScore": null,
    "status": "Upcoming",
    "highlights": "",
    "stats": null,
    "schoolId": "snake-river"
  },
  {
    "id": "sr-45",
    "sport": "Soccer",
    "gender": "Boys",
    "level": "Varsity",
    "opponent": "Soccer Event",
    "opponentMascot": "",
    "locationType": "Home",
    "date": "2026-10-12",
    "time": "TBA",
    "venueName": "Snake River High School",
    "venueAddress": "922 W Hwy 39, Blackfoot, ID 83221",
    "lat": 43.1904,
    "lng": -112.3456,
    "parkingInfo": "Standard spectator parking available.",
    "ticketUrl": "https://sugarsalemhighschool.arbiterwebsites.com/",
    "ourScore": null,
    "oppScore": null,
    "status": "Upcoming",
    "highlights": "",
    "stats": null,
    "schoolId": "snake-river"
  },
  {
    "id": "sr-46",
    "sport": "Volleyball",
    "gender": "Girls",
    "level": "C-Team",
    "opponent": "South Fremont High School",
    "opponentMascot": "",
    "locationType": "Home",
    "date": "2026-10-13",
    "time": "4:30 PM",
    "venueName": "Snake River High School",
    "venueAddress": "922 W Hwy 39, Blackfoot, ID 83221",
    "lat": 43.1904,
    "lng": -112.3456,
    "parkingInfo": "Standard spectator parking available.",
    "ticketUrl": "https://sugarsalemhighschool.arbiterwebsites.com/",
    "ourScore": null,
    "oppScore": null,
    "status": "Upcoming",
    "highlights": "",
    "stats": null,
    "schoolId": "snake-river"
  },
  {
    "id": "sr-47",
    "sport": "Soccer",
    "gender": "Girls",
    "level": "Varsity",
    "opponent": "Teton High School",
    "opponentMascot": "",
    "locationType": "Home",
    "date": "2026-10-14",
    "time": "5:30 PM",
    "venueName": "Snake River High School",
    "venueAddress": "922 W Hwy 39, Blackfoot, ID 83221",
    "lat": 43.1904,
    "lng": -112.3456,
    "parkingInfo": "Standard spectator parking available.",
    "ticketUrl": "https://sugarsalemhighschool.arbiterwebsites.com/",
    "ourScore": null,
    "oppScore": null,
    "status": "Upcoming",
    "highlights": "",
    "stats": null,
    "schoolId": "snake-river"
  },
  {
    "id": "sr-48",
    "sport": "Volleyball",
    "gender": "Girls",
    "level": "Junior Varsity",
    "opponent": "Volleyball Event",
    "opponentMascot": "",
    "locationType": "Home",
    "date": "2026-10-15",
    "time": "TBA",
    "venueName": "Snake River High School",
    "venueAddress": "922 W Hwy 39, Blackfoot, ID 83221",
    "lat": 43.1904,
    "lng": -112.3456,
    "parkingInfo": "Standard spectator parking available.",
    "ticketUrl": "https://sugarsalemhighschool.arbiterwebsites.com/",
    "ourScore": null,
    "oppScore": null,
    "status": "Upcoming",
    "highlights": "",
    "stats": null,
    "schoolId": "snake-river"
  },
  {
    "id": "sr-49",
    "sport": "Volleyball",
    "gender": "Girls",
    "level": "Junior Varsity",
    "opponent": "South Fremont High School",
    "opponentMascot": "",
    "locationType": "Home",
    "date": "2026-10-16",
    "time": "5:30 PM",
    "venueName": "Snake River High School",
    "venueAddress": "922 W Hwy 39, Blackfoot, ID 83221",
    "lat": 43.1904,
    "lng": -112.3456,
    "parkingInfo": "Standard spectator parking available.",
    "ticketUrl": "https://sugarsalemhighschool.arbiterwebsites.com/",
    "ourScore": null,
    "oppScore": null,
    "status": "Upcoming",
    "highlights": "",
    "stats": null,
    "schoolId": "snake-river"
  },
  {
    "id": "sr-50",
    "sport": "Volleyball",
    "gender": "Girls",
    "level": "Varsity",
    "opponent": "Volleyball Event",
    "opponentMascot": "",
    "locationType": "Home",
    "date": "2026-10-17",
    "time": "6:30 PM",
    "venueName": "Snake River High School",
    "venueAddress": "922 W Hwy 39, Blackfoot, ID 83221",
    "lat": 43.1904,
    "lng": -112.3456,
    "parkingInfo": "Standard spectator parking available.",
    "ticketUrl": "https://sugarsalemhighschool.arbiterwebsites.com/",
    "ourScore": null,
    "oppScore": null,
    "status": "Upcoming",
    "highlights": "",
    "stats": null,
    "schoolId": "snake-river"
  },
  {
    "id": "sr-51",
    "sport": "Soccer",
    "gender": "Boys",
    "level": "Varsity",
    "opponent": "Firth High School",
    "opponentMascot": "",
    "locationType": "Away",
    "date": "2026-10-18",
    "time": "5:45 PM",
    "venueName": "Firth High School Stadium",
    "venueAddress": "Firth High School, ID",
    "lat": 43.8744,
    "lng": -111.7483,
    "parkingInfo": "Standard spectator parking available.",
    "ticketUrl": "https://sugarsalemhighschool.arbiterwebsites.com/",
    "ourScore": null,
    "oppScore": null,
    "status": "Upcoming",
    "highlights": "",
    "stats": null,
    "schoolId": "snake-river"
  },
  {
    "id": "sr-52",
    "sport": "Soccer",
    "gender": "Boys",
    "level": "Varsity",
    "opponent": "Teton High School",
    "opponentMascot": "",
    "locationType": "Home",
    "date": "2026-10-19",
    "time": "7:00 PM",
    "venueName": "Snake River High School",
    "venueAddress": "922 W Hwy 39, Blackfoot, ID 83221",
    "lat": 43.1904,
    "lng": -112.3456,
    "parkingInfo": "Standard spectator parking available.",
    "ticketUrl": "https://sugarsalemhighschool.arbiterwebsites.com/",
    "ourScore": null,
    "oppScore": null,
    "status": "Upcoming",
    "highlights": "",
    "stats": null,
    "schoolId": "snake-river"
  },
  {
    "id": "sr-53",
    "sport": "Volleyball",
    "gender": "Girls",
    "level": "Varsity",
    "opponent": "South Fremont High School",
    "opponentMascot": "",
    "locationType": "Home",
    "date": "2026-10-20",
    "time": "7:00 PM",
    "venueName": "Snake River High School",
    "venueAddress": "922 W Hwy 39, Blackfoot, ID 83221",
    "lat": 43.1904,
    "lng": -112.3456,
    "parkingInfo": "Standard spectator parking available.",
    "ticketUrl": "https://sugarsalemhighschool.arbiterwebsites.com/",
    "ourScore": null,
    "oppScore": null,
    "status": "Upcoming",
    "highlights": "",
    "stats": null,
    "schoolId": "snake-river"
  },
  {
    "id": "sr-54",
    "sport": "Soccer",
    "gender": "Girls",
    "level": "Varsity",
    "opponent": "Soccer Event",
    "opponentMascot": "",
    "locationType": "Home",
    "date": "2026-10-21",
    "time": "TBA",
    "venueName": "Snake River High School",
    "venueAddress": "922 W Hwy 39, Blackfoot, ID 83221",
    "lat": 43.1904,
    "lng": -112.3456,
    "parkingInfo": "Standard spectator parking available.",
    "ticketUrl": "https://sugarsalemhighschool.arbiterwebsites.com/",
    "ourScore": null,
    "oppScore": null,
    "status": "Upcoming",
    "highlights": "",
    "stats": null,
    "schoolId": "snake-river"
  },
  {
    "id": "sr-55",
    "sport": "Volleyball",
    "gender": "Girls",
    "level": "Varsity",
    "opponent": "Volleyball Event",
    "opponentMascot": "",
    "locationType": "Home",
    "date": "2026-10-22",
    "time": "TBA",
    "venueName": "Snake River High School",
    "venueAddress": "922 W Hwy 39, Blackfoot, ID 83221",
    "lat": 43.1904,
    "lng": -112.3456,
    "parkingInfo": "Standard spectator parking available.",
    "ticketUrl": "https://sugarsalemhighschool.arbiterwebsites.com/",
    "ourScore": null,
    "oppScore": null,
    "status": "Upcoming",
    "highlights": "",
    "stats": null,
    "schoolId": "snake-river"
  },
  {
    "id": "sr-56",
    "sport": "Volleyball",
    "gender": "Girls",
    "level": "C-Team",
    "opponent": "Idaho Falls High School",
    "opponentMascot": "",
    "locationType": "Home",
    "date": "2026-10-23",
    "time": "4:30 PM",
    "venueName": "Snake River High School",
    "venueAddress": "922 W Hwy 39, Blackfoot, ID 83221",
    "lat": 43.1904,
    "lng": -112.3456,
    "parkingInfo": "Standard spectator parking available.",
    "ticketUrl": "https://sugarsalemhighschool.arbiterwebsites.com/",
    "ourScore": null,
    "oppScore": null,
    "status": "Upcoming",
    "highlights": "",
    "stats": null,
    "schoolId": "snake-river"
  },
  {
    "id": "sr-57",
    "sport": "Volleyball",
    "gender": "Girls",
    "level": "C-Team",
    "opponent": "Teton High School",
    "opponentMascot": "",
    "locationType": "Away",
    "date": "2026-10-24",
    "time": "4:30 PM",
    "venueName": "Teton High School Stadium",
    "venueAddress": "Teton High School, ID",
    "lat": 43.8744,
    "lng": -111.7483,
    "parkingInfo": "Standard spectator parking available.",
    "ticketUrl": "https://sugarsalemhighschool.arbiterwebsites.com/",
    "ourScore": null,
    "oppScore": null,
    "status": "Upcoming",
    "highlights": "",
    "stats": null,
    "schoolId": "snake-river"
  },
  {
    "id": "sr-58",
    "sport": "Volleyball",
    "gender": "Girls",
    "level": "C-Team",
    "opponent": "Volleyball Event",
    "opponentMascot": "",
    "locationType": "Home",
    "date": "2026-10-25",
    "time": "9:31 PM",
    "venueName": "Snake River High School",
    "venueAddress": "922 W Hwy 39, Blackfoot, ID 83221",
    "lat": 43.1904,
    "lng": -112.3456,
    "parkingInfo": "Standard spectator parking available.",
    "ticketUrl": "https://sugarsalemhighschool.arbiterwebsites.com/",
    "ourScore": null,
    "oppScore": null,
    "status": "Upcoming",
    "highlights": "",
    "stats": null,
    "schoolId": "snake-river"
  },
  {
    "id": "sr-59",
    "sport": "Soccer",
    "gender": "Boys",
    "level": "Varsity",
    "opponent": "Soccer Event",
    "opponentMascot": "",
    "locationType": "Home",
    "date": "2026-10-26",
    "time": "TBA",
    "venueName": "Snake River High School",
    "venueAddress": "922 W Hwy 39, Blackfoot, ID 83221",
    "lat": 43.1904,
    "lng": -112.3456,
    "parkingInfo": "Standard spectator parking available.",
    "ticketUrl": "https://sugarsalemhighschool.arbiterwebsites.com/",
    "ourScore": null,
    "oppScore": null,
    "status": "Upcoming",
    "highlights": "",
    "stats": null,
    "schoolId": "snake-river"
  },
  {
    "id": "sr-60",
    "sport": "Volleyball",
    "gender": "Girls",
    "level": "Junior Varsity",
    "opponent": "Idaho Falls High School",
    "opponentMascot": "",
    "locationType": "Home",
    "date": "2026-10-27",
    "time": "5:30 PM",
    "venueName": "Snake River High School",
    "venueAddress": "922 W Hwy 39, Blackfoot, ID 83221",
    "lat": 43.1904,
    "lng": -112.3456,
    "parkingInfo": "Standard spectator parking available.",
    "ticketUrl": "https://sugarsalemhighschool.arbiterwebsites.com/",
    "ourScore": null,
    "oppScore": null,
    "status": "Upcoming",
    "highlights": "",
    "stats": null,
    "schoolId": "snake-river"
  },
  {
    "id": "sr-61",
    "sport": "Volleyball",
    "gender": "Girls",
    "level": "Junior Varsity",
    "opponent": "Teton High School",
    "opponentMascot": "",
    "locationType": "Away",
    "date": "2026-10-28",
    "time": "5:30 PM",
    "venueName": "Teton High School Stadium",
    "venueAddress": "Teton High School, ID",
    "lat": 43.8744,
    "lng": -111.7483,
    "parkingInfo": "Standard spectator parking available.",
    "ticketUrl": "https://sugarsalemhighschool.arbiterwebsites.com/",
    "ourScore": null,
    "oppScore": null,
    "status": "Upcoming",
    "highlights": "",
    "stats": null,
    "schoolId": "snake-river"
  },
  {
    "id": "sr-62",
    "sport": "Volleyball",
    "gender": "Girls",
    "level": "Junior Varsity",
    "opponent": "Volleyball Event",
    "opponentMascot": "",
    "locationType": "Home",
    "date": "2026-10-28",
    "time": "10:31 PM",
    "venueName": "Snake River High School",
    "venueAddress": "922 W Hwy 39, Blackfoot, ID 83221",
    "lat": 43.1904,
    "lng": -112.3456,
    "parkingInfo": "Standard spectator parking available.",
    "ticketUrl": "https://sugarsalemhighschool.arbiterwebsites.com/",
    "ourScore": null,
    "oppScore": null,
    "status": "Upcoming",
    "highlights": "",
    "stats": null,
    "schoolId": "snake-river"
  },
  {
    "id": "sr-63",
    "sport": "Volleyball",
    "gender": "Girls",
    "level": "Varsity",
    "opponent": "Idaho Falls High School",
    "opponentMascot": "",
    "locationType": "Home",
    "date": "2026-10-28",
    "time": "7:00 PM",
    "venueName": "Snake River High School",
    "venueAddress": "922 W Hwy 39, Blackfoot, ID 83221",
    "lat": 43.1904,
    "lng": -112.3456,
    "parkingInfo": "Standard spectator parking available.",
    "ticketUrl": "https://sugarsalemhighschool.arbiterwebsites.com/",
    "ourScore": null,
    "oppScore": null,
    "status": "Upcoming",
    "highlights": "",
    "stats": null,
    "schoolId": "snake-river"
  },
  {
    "id": "sr-64",
    "sport": "Volleyball",
    "gender": "Girls",
    "level": "Varsity",
    "opponent": "Teton High School",
    "opponentMascot": "",
    "locationType": "Away",
    "date": "2026-10-28",
    "time": "7:00 PM",
    "venueName": "Teton High School Stadium",
    "venueAddress": "Teton High School, ID",
    "lat": 43.8744,
    "lng": -111.7483,
    "parkingInfo": "Standard spectator parking available.",
    "ticketUrl": "https://sugarsalemhighschool.arbiterwebsites.com/",
    "ourScore": null,
    "oppScore": null,
    "status": "Upcoming",
    "highlights": "",
    "stats": null,
    "schoolId": "snake-river"
  },
  {
    "id": "sr-65",
    "sport": "Volleyball",
    "gender": "Girls",
    "level": "Varsity",
    "opponent": "Volleyball Event",
    "opponentMascot": "",
    "locationType": "Home",
    "date": "2026-10-28",
    "time": "TBA",
    "venueName": "Snake River High School",
    "venueAddress": "922 W Hwy 39, Blackfoot, ID 83221",
    "lat": 43.1904,
    "lng": -112.3456,
    "parkingInfo": "Standard spectator parking available.",
    "ticketUrl": "https://sugarsalemhighschool.arbiterwebsites.com/",
    "ourScore": null,
    "oppScore": null,
    "status": "Upcoming",
    "highlights": "",
    "stats": null,
    "schoolId": "snake-river"
  },
  {
    "id": "sr-66",
    "sport": "Football",
    "gender": "Boys",
    "level": "Junior Varsity",
    "opponent": "Layton Christian Academy",
    "opponentMascot": "",
    "locationType": "Away",
    "date": "2026-10-28",
    "time": "12:00 PM",
    "venueName": "Layton Christian Academy Stadium",
    "venueAddress": "Layton Christian Academy, ID",
    "lat": 43.8744,
    "lng": -111.7483,
    "parkingInfo": "Standard spectator parking available.",
    "ticketUrl": "https://sugarsalemhighschool.arbiterwebsites.com/",
    "ourScore": null,
    "oppScore": null,
    "status": "Upcoming",
    "highlights": "",
    "stats": null,
    "schoolId": "snake-river"
  },
  {
    "id": "sr-67",
    "sport": "Football",
    "gender": "Boys",
    "level": "Varsity",
    "opponent": "Layton Christian Academy",
    "opponentMascot": "",
    "locationType": "Away",
    "date": "2026-10-28",
    "time": "4:00 PM",
    "venueName": "Layton Christian Academy Stadium",
    "venueAddress": "Layton Christian Academy, ID",
    "lat": 43.8744,
    "lng": -111.7483,
    "parkingInfo": "Standard spectator parking available.",
    "ticketUrl": "https://sugarsalemhighschool.arbiterwebsites.com/",
    "ourScore": null,
    "oppScore": null,
    "status": "Upcoming",
    "highlights": "",
    "stats": null,
    "schoolId": "snake-river"
  },
  {
    "id": "sr-68",
    "sport": "Basketball",
    "gender": "Girls",
    "level": "C-Team",
    "opponent": "Jerome High School",
    "opponentMascot": "",
    "locationType": "Home",
    "date": "2026-11-01",
    "time": "4:30 PM",
    "venueName": "Snake River High School",
    "venueAddress": "922 W Hwy 39, Blackfoot, ID 83221",
    "lat": 43.1904,
    "lng": -112.3456,
    "parkingInfo": "Standard spectator parking available.",
    "ticketUrl": "https://sugarsalemhighschool.arbiterwebsites.com/",
    "ourScore": null,
    "oppScore": null,
    "status": "Upcoming",
    "highlights": "",
    "stats": null,
    "schoolId": "snake-river"
  },
  {
    "id": "sr-69",
    "sport": "Basketball",
    "gender": "Girls",
    "level": "Junior Varsity",
    "opponent": "Jerome High School",
    "opponentMascot": "",
    "locationType": "Home",
    "date": "2026-11-02",
    "time": "6:00 PM",
    "venueName": "Snake River High School",
    "venueAddress": "922 W Hwy 39, Blackfoot, ID 83221",
    "lat": 43.1904,
    "lng": -112.3456,
    "parkingInfo": "Standard spectator parking available.",
    "ticketUrl": "https://sugarsalemhighschool.arbiterwebsites.com/",
    "ourScore": null,
    "oppScore": null,
    "status": "Upcoming",
    "highlights": "",
    "stats": null,
    "schoolId": "snake-river"
  },
  {
    "id": "sr-70",
    "sport": "Basketball",
    "gender": "Girls",
    "level": "Varsity",
    "opponent": "Jerome High School",
    "opponentMascot": "",
    "locationType": "Home",
    "date": "2026-11-03",
    "time": "7:30 PM",
    "venueName": "Snake River High School",
    "venueAddress": "922 W Hwy 39, Blackfoot, ID 83221",
    "lat": 43.1904,
    "lng": -112.3456,
    "parkingInfo": "Standard spectator parking available.",
    "ticketUrl": "https://sugarsalemhighschool.arbiterwebsites.com/",
    "ourScore": null,
    "oppScore": null,
    "status": "Upcoming",
    "highlights": "",
    "stats": null,
    "schoolId": "snake-river"
  },
  {
    "id": "sr-71",
    "sport": "Basketball",
    "gender": "Girls",
    "level": "Junior Varsity",
    "opponent": "Fruitland High School",
    "opponentMascot": "",
    "locationType": "Home",
    "date": "2026-11-04",
    "time": "TBA",
    "venueName": "Snake River High School",
    "venueAddress": "922 W Hwy 39, Blackfoot, ID 83221",
    "lat": 43.1904,
    "lng": -112.3456,
    "parkingInfo": "Standard spectator parking available.",
    "ticketUrl": "https://sugarsalemhighschool.arbiterwebsites.com/",
    "ourScore": null,
    "oppScore": null,
    "status": "Upcoming",
    "highlights": "",
    "stats": null,
    "schoolId": "snake-river"
  },
  {
    "id": "sr-72",
    "sport": "Basketball",
    "gender": "Girls",
    "level": "Junior Varsity",
    "opponent": "Fruitland High School",
    "opponentMascot": "",
    "locationType": "Home",
    "date": "2026-11-05",
    "time": "TBA",
    "venueName": "Snake River High School",
    "venueAddress": "922 W Hwy 39, Blackfoot, ID 83221",
    "lat": 43.1904,
    "lng": -112.3456,
    "parkingInfo": "Standard spectator parking available.",
    "ticketUrl": "https://sugarsalemhighschool.arbiterwebsites.com/",
    "ourScore": null,
    "oppScore": null,
    "status": "Upcoming",
    "highlights": "",
    "stats": null,
    "schoolId": "snake-river"
  },
  {
    "id": "sr-73",
    "sport": "Basketball",
    "gender": "Girls",
    "level": "Junior Varsity",
    "opponent": "Fruitland High School",
    "opponentMascot": "",
    "locationType": "Home",
    "date": "2026-11-06",
    "time": "TBA",
    "venueName": "Snake River High School",
    "venueAddress": "922 W Hwy 39, Blackfoot, ID 83221",
    "lat": 43.1904,
    "lng": -112.3456,
    "parkingInfo": "Standard spectator parking available.",
    "ticketUrl": "https://sugarsalemhighschool.arbiterwebsites.com/",
    "ourScore": null,
    "oppScore": null,
    "status": "Upcoming",
    "highlights": "",
    "stats": null,
    "schoolId": "snake-river"
  },
  {
    "id": "sr-74",
    "sport": "Basketball",
    "gender": "Boys",
    "level": "Freshman",
    "opponent": "Kimberly High School",
    "opponentMascot": "",
    "locationType": "Home",
    "date": "2026-11-07",
    "time": "4:30 PM",
    "venueName": "Snake River High School",
    "venueAddress": "922 W Hwy 39, Blackfoot, ID 83221",
    "lat": 43.1904,
    "lng": -112.3456,
    "parkingInfo": "Standard spectator parking available.",
    "ticketUrl": "https://sugarsalemhighschool.arbiterwebsites.com/",
    "ourScore": null,
    "oppScore": null,
    "status": "Upcoming",
    "highlights": "",
    "stats": null,
    "schoolId": "snake-river"
  },
  {
    "id": "sr-75",
    "sport": "Basketball",
    "gender": "Girls",
    "level": "Varsity",
    "opponent": "Fruitland High School",
    "opponentMascot": "",
    "locationType": "Home",
    "date": "2026-11-08",
    "time": "TBA",
    "venueName": "Snake River High School",
    "venueAddress": "922 W Hwy 39, Blackfoot, ID 83221",
    "lat": 43.1904,
    "lng": -112.3456,
    "parkingInfo": "Standard spectator parking available.",
    "ticketUrl": "https://sugarsalemhighschool.arbiterwebsites.com/",
    "ourScore": null,
    "oppScore": null,
    "status": "Upcoming",
    "highlights": "",
    "stats": null,
    "schoolId": "snake-river"
  },
  {
    "id": "sr-76",
    "sport": "Basketball",
    "gender": "Girls",
    "level": "Varsity",
    "opponent": "Fruitland High School",
    "opponentMascot": "",
    "locationType": "Home",
    "date": "2026-11-09",
    "time": "TBA",
    "venueName": "Snake River High School",
    "venueAddress": "922 W Hwy 39, Blackfoot, ID 83221",
    "lat": 43.1904,
    "lng": -112.3456,
    "parkingInfo": "Standard spectator parking available.",
    "ticketUrl": "https://sugarsalemhighschool.arbiterwebsites.com/",
    "ourScore": null,
    "oppScore": null,
    "status": "Upcoming",
    "highlights": "",
    "stats": null,
    "schoolId": "snake-river"
  },
  {
    "id": "sr-77",
    "sport": "Basketball",
    "gender": "Girls",
    "level": "Varsity",
    "opponent": "Fruitland High School",
    "opponentMascot": "",
    "locationType": "Home",
    "date": "2026-11-10",
    "time": "TBA",
    "venueName": "Snake River High School",
    "venueAddress": "922 W Hwy 39, Blackfoot, ID 83221",
    "lat": 43.1904,
    "lng": -112.3456,
    "parkingInfo": "Standard spectator parking available.",
    "ticketUrl": "https://sugarsalemhighschool.arbiterwebsites.com/",
    "ourScore": null,
    "oppScore": null,
    "status": "Upcoming",
    "highlights": "",
    "stats": null,
    "schoolId": "snake-river"
  },
  {
    "id": "sr-78",
    "sport": "Basketball",
    "gender": "Boys",
    "level": "Junior Varsity",
    "opponent": "Kimberly High School",
    "opponentMascot": "",
    "locationType": "Home",
    "date": "2026-11-11",
    "time": "6:00 PM",
    "venueName": "Snake River High School",
    "venueAddress": "922 W Hwy 39, Blackfoot, ID 83221",
    "lat": 43.1904,
    "lng": -112.3456,
    "parkingInfo": "Standard spectator parking available.",
    "ticketUrl": "https://sugarsalemhighschool.arbiterwebsites.com/",
    "ourScore": null,
    "oppScore": null,
    "status": "Upcoming",
    "highlights": "",
    "stats": null,
    "schoolId": "snake-river"
  },
  {
    "id": "sr-79",
    "sport": "Basketball",
    "gender": "Boys",
    "level": "Varsity",
    "opponent": "Kimberly High School",
    "opponentMascot": "",
    "locationType": "Home",
    "date": "2026-11-12",
    "time": "7:30 PM",
    "venueName": "Snake River High School",
    "venueAddress": "922 W Hwy 39, Blackfoot, ID 83221",
    "lat": 43.1904,
    "lng": -112.3456,
    "parkingInfo": "Standard spectator parking available.",
    "ticketUrl": "https://sugarsalemhighschool.arbiterwebsites.com/",
    "ourScore": null,
    "oppScore": null,
    "status": "Upcoming",
    "highlights": "",
    "stats": null,
    "schoolId": "snake-river"
  },
  {
    "id": "sr-80",
    "sport": "Basketball",
    "gender": "Girls",
    "level": "Junior Varsity",
    "opponent": "Fruitland High School",
    "opponentMascot": "",
    "locationType": "Home",
    "date": "2026-12-01",
    "time": "TBA",
    "venueName": "Snake River High School",
    "venueAddress": "922 W Hwy 39, Blackfoot, ID 83221",
    "lat": 43.1904,
    "lng": -112.3456,
    "parkingInfo": "Standard spectator parking available.",
    "ticketUrl": "https://sugarsalemhighschool.arbiterwebsites.com/",
    "ourScore": null,
    "oppScore": null,
    "status": "Upcoming",
    "highlights": "",
    "stats": null,
    "schoolId": "snake-river"
  },
  {
    "id": "sr-81",
    "sport": "Basketball",
    "gender": "Girls",
    "level": "Junior Varsity",
    "opponent": "Fruitland High School",
    "opponentMascot": "",
    "locationType": "Home",
    "date": "2026-12-02",
    "time": "TBA",
    "venueName": "Snake River High School",
    "venueAddress": "922 W Hwy 39, Blackfoot, ID 83221",
    "lat": 43.1904,
    "lng": -112.3456,
    "parkingInfo": "Standard spectator parking available.",
    "ticketUrl": "https://sugarsalemhighschool.arbiterwebsites.com/",
    "ourScore": null,
    "oppScore": null,
    "status": "Upcoming",
    "highlights": "",
    "stats": null,
    "schoolId": "snake-river"
  },
  {
    "id": "sr-82",
    "sport": "Basketball",
    "gender": "Girls",
    "level": "Junior Varsity",
    "opponent": "Fruitland High School",
    "opponentMascot": "",
    "locationType": "Home",
    "date": "2026-12-03",
    "time": "TBA",
    "venueName": "Snake River High School",
    "venueAddress": "922 W Hwy 39, Blackfoot, ID 83221",
    "lat": 43.1904,
    "lng": -112.3456,
    "parkingInfo": "Standard spectator parking available.",
    "ticketUrl": "https://sugarsalemhighschool.arbiterwebsites.com/",
    "ourScore": null,
    "oppScore": null,
    "status": "Upcoming",
    "highlights": "",
    "stats": null,
    "schoolId": "snake-river"
  },
  {
    "id": "sr-83",
    "sport": "Basketball",
    "gender": "Boys",
    "level": "Freshman",
    "opponent": "Kimberly High School",
    "opponentMascot": "",
    "locationType": "Home",
    "date": "2026-12-04",
    "time": "4:30 PM",
    "venueName": "Snake River High School",
    "venueAddress": "922 W Hwy 39, Blackfoot, ID 83221",
    "lat": 43.1904,
    "lng": -112.3456,
    "parkingInfo": "Standard spectator parking available.",
    "ticketUrl": "https://sugarsalemhighschool.arbiterwebsites.com/",
    "ourScore": null,
    "oppScore": null,
    "status": "Upcoming",
    "highlights": "",
    "stats": null,
    "schoolId": "snake-river"
  },
  {
    "id": "sr-84",
    "sport": "Basketball",
    "gender": "Girls",
    "level": "Varsity",
    "opponent": "Fruitland High School",
    "opponentMascot": "",
    "locationType": "Home",
    "date": "2026-12-05",
    "time": "TBA",
    "venueName": "Snake River High School",
    "venueAddress": "922 W Hwy 39, Blackfoot, ID 83221",
    "lat": 43.1904,
    "lng": -112.3456,
    "parkingInfo": "Standard spectator parking available.",
    "ticketUrl": "https://sugarsalemhighschool.arbiterwebsites.com/",
    "ourScore": null,
    "oppScore": null,
    "status": "Upcoming",
    "highlights": "",
    "stats": null,
    "schoolId": "snake-river"
  },
  {
    "id": "sr-85",
    "sport": "Basketball",
    "gender": "Girls",
    "level": "Varsity",
    "opponent": "Fruitland High School",
    "opponentMascot": "",
    "locationType": "Home",
    "date": "2026-12-06",
    "time": "TBA",
    "venueName": "Snake River High School",
    "venueAddress": "922 W Hwy 39, Blackfoot, ID 83221",
    "lat": 43.1904,
    "lng": -112.3456,
    "parkingInfo": "Standard spectator parking available.",
    "ticketUrl": "https://sugarsalemhighschool.arbiterwebsites.com/",
    "ourScore": null,
    "oppScore": null,
    "status": "Upcoming",
    "highlights": "",
    "stats": null,
    "schoolId": "snake-river"
  },
  {
    "id": "sr-86",
    "sport": "Basketball",
    "gender": "Girls",
    "level": "Varsity",
    "opponent": "Fruitland High School",
    "opponentMascot": "",
    "locationType": "Home",
    "date": "2026-12-07",
    "time": "TBA",
    "venueName": "Snake River High School",
    "venueAddress": "922 W Hwy 39, Blackfoot, ID 83221",
    "lat": 43.1904,
    "lng": -112.3456,
    "parkingInfo": "Standard spectator parking available.",
    "ticketUrl": "https://sugarsalemhighschool.arbiterwebsites.com/",
    "ourScore": null,
    "oppScore": null,
    "status": "Upcoming",
    "highlights": "",
    "stats": null,
    "schoolId": "snake-river"
  },
  {
    "id": "sr-87",
    "sport": "Basketball",
    "gender": "Boys",
    "level": "Junior Varsity",
    "opponent": "Kimberly High School",
    "opponentMascot": "",
    "locationType": "Home",
    "date": "2026-12-08",
    "time": "6:00 PM",
    "venueName": "Snake River High School",
    "venueAddress": "922 W Hwy 39, Blackfoot, ID 83221",
    "lat": 43.1904,
    "lng": -112.3456,
    "parkingInfo": "Standard spectator parking available.",
    "ticketUrl": "https://sugarsalemhighschool.arbiterwebsites.com/",
    "ourScore": null,
    "oppScore": null,
    "status": "Upcoming",
    "highlights": "",
    "stats": null,
    "schoolId": "snake-river"
  },
  {
    "id": "sr-88",
    "sport": "Basketball",
    "gender": "Boys",
    "level": "Varsity",
    "opponent": "Kimberly High School",
    "opponentMascot": "",
    "locationType": "Home",
    "date": "2026-12-09",
    "time": "7:30 PM",
    "venueName": "Snake River High School",
    "venueAddress": "922 W Hwy 39, Blackfoot, ID 83221",
    "lat": 43.1904,
    "lng": -112.3456,
    "parkingInfo": "Standard spectator parking available.",
    "ticketUrl": "https://sugarsalemhighschool.arbiterwebsites.com/",
    "ourScore": null,
    "oppScore": null,
    "status": "Upcoming",
    "highlights": "",
    "stats": null,
    "schoolId": "snake-river"
  },
  {
    "id": "sr-89",
    "sport": "Basketball",
    "gender": "Boys",
    "level": "C-Team",
    "opponent": "Star Valley High School",
    "opponentMascot": "",
    "locationType": "Away",
    "date": "2026-12-10",
    "time": "4:30 PM",
    "venueName": "Star Valley High School Stadium",
    "venueAddress": "Star Valley High School, ID",
    "lat": 43.8744,
    "lng": -111.7483,
    "parkingInfo": "Standard spectator parking available.",
    "ticketUrl": "https://sugarsalemhighschool.arbiterwebsites.com/",
    "ourScore": null,
    "oppScore": null,
    "status": "Upcoming",
    "highlights": "",
    "stats": null,
    "schoolId": "snake-river"
  },
  {
    "id": "sr-90",
    "sport": "Basketball",
    "gender": "Boys",
    "level": "Junior Varsity",
    "opponent": "Star Valley High School",
    "opponentMascot": "",
    "locationType": "Away",
    "date": "2026-12-11",
    "time": "6:00 PM",
    "venueName": "Star Valley High School Stadium",
    "venueAddress": "Star Valley High School, ID",
    "lat": 43.8744,
    "lng": -111.7483,
    "parkingInfo": "Standard spectator parking available.",
    "ticketUrl": "https://sugarsalemhighschool.arbiterwebsites.com/",
    "ourScore": null,
    "oppScore": null,
    "status": "Upcoming",
    "highlights": "",
    "stats": null,
    "schoolId": "snake-river"
  },
  {
    "id": "sr-91",
    "sport": "Basketball",
    "gender": "Boys",
    "level": "Varsity",
    "opponent": "Star Valley High School",
    "opponentMascot": "",
    "locationType": "Away",
    "date": "2026-12-12",
    "time": "7:30 PM",
    "venueName": "Star Valley High School Stadium",
    "venueAddress": "Star Valley High School, ID",
    "lat": 43.8744,
    "lng": -111.7483,
    "parkingInfo": "Standard spectator parking available.",
    "ticketUrl": "https://sugarsalemhighschool.arbiterwebsites.com/",
    "ourScore": null,
    "oppScore": null,
    "status": "Upcoming",
    "highlights": "",
    "stats": null,
    "schoolId": "snake-river"
  },
  {
    "id": "sr-92",
    "sport": "Basketball",
    "gender": "Boys",
    "level": "C-Team",
    "opponent": "Star Valley High School",
    "opponentMascot": "",
    "locationType": "Home",
    "date": "2027-01-01",
    "time": "4:30 PM",
    "venueName": "Snake River High School",
    "venueAddress": "922 W Hwy 39, Blackfoot, ID 83221",
    "lat": 43.1904,
    "lng": -112.3456,
    "parkingInfo": "Standard spectator parking available.",
    "ticketUrl": "https://sugarsalemhighschool.arbiterwebsites.com/",
    "ourScore": null,
    "oppScore": null,
    "status": "Upcoming",
    "highlights": "",
    "stats": null,
    "schoolId": "snake-river"
  },
  {
    "id": "sr-93",
    "sport": "Basketball",
    "gender": "Boys",
    "level": "Junior Varsity",
    "opponent": "Star Valley High School",
    "opponentMascot": "",
    "locationType": "Home",
    "date": "2027-01-02",
    "time": "6:00 PM",
    "venueName": "Snake River High School",
    "venueAddress": "922 W Hwy 39, Blackfoot, ID 83221",
    "lat": 43.1904,
    "lng": -112.3456,
    "parkingInfo": "Standard spectator parking available.",
    "ticketUrl": "https://sugarsalemhighschool.arbiterwebsites.com/",
    "ourScore": null,
    "oppScore": null,
    "status": "Upcoming",
    "highlights": "",
    "stats": null,
    "schoolId": "snake-river"
  },
  {
    "id": "sr-94",
    "sport": "Basketball",
    "gender": "Boys",
    "level": "Varsity",
    "opponent": "Star Valley High School",
    "opponentMascot": "",
    "locationType": "Home",
    "date": "2027-01-03",
    "time": "7:30 PM",
    "venueName": "Snake River High School",
    "venueAddress": "922 W Hwy 39, Blackfoot, ID 83221",
    "lat": 43.1904,
    "lng": -112.3456,
    "parkingInfo": "Standard spectator parking available.",
    "ticketUrl": "https://sugarsalemhighschool.arbiterwebsites.com/",
    "ourScore": null,
    "oppScore": null,
    "status": "Upcoming",
    "highlights": "",
    "stats": null,
    "schoolId": "snake-river"
  },
  {
    "id": "sr-95",
    "sport": "Basketball",
    "gender": "Girls",
    "level": "Freshman",
    "opponent": "Kimberly High School",
    "opponentMascot": "",
    "locationType": "Home",
    "date": "2027-01-04",
    "time": "1:00 PM",
    "venueName": "Snake River High School",
    "venueAddress": "922 W Hwy 39, Blackfoot, ID 83221",
    "lat": 43.1904,
    "lng": -112.3456,
    "parkingInfo": "Standard spectator parking available.",
    "ticketUrl": "https://sugarsalemhighschool.arbiterwebsites.com/",
    "ourScore": null,
    "oppScore": null,
    "status": "Upcoming",
    "highlights": "",
    "stats": null,
    "schoolId": "snake-river"
  },
  {
    "id": "sr-96",
    "sport": "Basketball",
    "gender": "Girls",
    "level": "Junior Varsity",
    "opponent": "Kimberly High School",
    "opponentMascot": "",
    "locationType": "Home",
    "date": "2027-01-05",
    "time": "2:30 PM",
    "venueName": "Snake River High School",
    "venueAddress": "922 W Hwy 39, Blackfoot, ID 83221",
    "lat": 43.1904,
    "lng": -112.3456,
    "parkingInfo": "Standard spectator parking available.",
    "ticketUrl": "https://sugarsalemhighschool.arbiterwebsites.com/",
    "ourScore": null,
    "oppScore": null,
    "status": "Upcoming",
    "highlights": "",
    "stats": null,
    "schoolId": "snake-river"
  },
  {
    "id": "sr-97",
    "sport": "Basketball",
    "gender": "Girls",
    "level": "Varsity",
    "opponent": "Kimberly High School",
    "opponentMascot": "",
    "locationType": "Home",
    "date": "2027-01-06",
    "time": "4:00 PM",
    "venueName": "Snake River High School",
    "venueAddress": "922 W Hwy 39, Blackfoot, ID 83221",
    "lat": 43.1904,
    "lng": -112.3456,
    "parkingInfo": "Standard spectator parking available.",
    "ticketUrl": "https://sugarsalemhighschool.arbiterwebsites.com/",
    "ourScore": null,
    "oppScore": null,
    "status": "Upcoming",
    "highlights": "",
    "stats": null,
    "schoolId": "snake-river"
  },
  {
    "id": "sr-98",
    "sport": "Basketball",
    "gender": "Boys",
    "level": "Freshman",
    "opponent": "Kimberly High School",
    "opponentMascot": "",
    "locationType": "Away",
    "date": "2027-01-07",
    "time": "4:30 PM",
    "venueName": "Kimberly High School Stadium",
    "venueAddress": "Kimberly High School, ID",
    "lat": 43.8744,
    "lng": -111.7483,
    "parkingInfo": "Standard spectator parking available.",
    "ticketUrl": "https://sugarsalemhighschool.arbiterwebsites.com/",
    "ourScore": null,
    "oppScore": null,
    "status": "Upcoming",
    "highlights": "",
    "stats": null,
    "schoolId": "snake-river"
  },
  {
    "id": "sr-99",
    "sport": "Basketball",
    "gender": "Boys",
    "level": "Junior Varsity",
    "opponent": "Kimberly High School",
    "opponentMascot": "",
    "locationType": "Away",
    "date": "2027-01-08",
    "time": "6:00 PM",
    "venueName": "Kimberly High School Stadium",
    "venueAddress": "Kimberly High School, ID",
    "lat": 43.8744,
    "lng": -111.7483,
    "parkingInfo": "Standard spectator parking available.",
    "ticketUrl": "https://sugarsalemhighschool.arbiterwebsites.com/",
    "ourScore": null,
    "oppScore": null,
    "status": "Upcoming",
    "highlights": "",
    "stats": null,
    "schoolId": "snake-river"
  },
  {
    "id": "sr-100",
    "sport": "Basketball",
    "gender": "Boys",
    "level": "Varsity",
    "opponent": "Kimberly High School",
    "opponentMascot": "",
    "locationType": "Away",
    "date": "2027-01-09",
    "time": "7:30 PM",
    "venueName": "Kimberly High School Stadium",
    "venueAddress": "Kimberly High School, ID",
    "lat": 43.8744,
    "lng": -111.7483,
    "parkingInfo": "Standard spectator parking available.",
    "ticketUrl": "https://sugarsalemhighschool.arbiterwebsites.com/",
    "ourScore": null,
    "oppScore": null,
    "status": "Upcoming",
    "highlights": "",
    "stats": null,
    "schoolId": "snake-river"
  }
];

  // Comprehensive Authentic Sugar-Salem High School Diggers Athletic & Event Schedule
  // Covers all Fall, Winter, Spring sports and School events from https://hs.sugarsalem.org/sportscalendars
  const DEFAULT_EVENTS = [
    // ==========================================
    // 1. FOOTBALL (Varsity & Key Games)
    // ==========================================
    {
      id: 'ss-fb-01',
      sport: 'Football',
      gender: 'Boys',
      level: 'Varsity',
      opponent: 'Homedale Trojans',
      opponentMascot: 'Trojans',
      locationType: 'Away',
      date: '2026-08-22',
      time: '4:00 PM',
      venueName: 'Canyon Ridge High Stadium',
      venueAddress: '300 N College Rd W, Twin Falls, ID 83301',
      lat: 42.5850,
      lng: -114.4750,
      parkingInfo: 'North Spectator Parking Lot. Tickets online via GoFan or gate.',
      ticketUrl: 'https://arbiterlive.com/Teams/Schedule/7063843?activeEntityId=22686',
      ourScore: 28,
      oppScore: 21,
      status: 'Final',
      highlights: 'Season opener classic in Twin Falls! Strong defensive stop in Q4 to seal the victory.',
      stats: {
        periods: [
          { name: 'Q1', us: 7, them: 0 },
          { name: 'Q2', us: 7, them: 14 },
          { name: 'Q3', us: 7, them: 0 },
          { name: 'Q4', us: 7, them: 7 }
        ],
        playerOfTheGame: {
          name: 'Dawson McInelly (#7)',
          stat: '142 Rushing YDS, 2 TD, 1 INT',
          avatar: 'DM'
        },
        teamStats: { totalYards: 345, passingYards: 160, rushingYards: 185, turnovers: 1 }
      }
    },
    {
      id: 'ss-fb-02',
      sport: 'Football',
      gender: 'Boys',
      level: 'Varsity',
      opponent: 'Snake River Panthers',
      opponentMascot: 'Panthers',
      locationType: 'Away',
      date: '2026-08-28',
      time: '7:00 PM',
      venueName: 'Snake River High Football Stadium',
      venueAddress: '922 W Hwy 39, Blackfoot, ID 83221',
      lat: 43.2185,
      lng: -112.3920,
      parkingInfo: 'Main lot adjacent to football field. Gates open at 5:30 PM.',
      ticketUrl: 'https://arbiterlive.com/Teams/Schedule/7063843?activeEntityId=22686',
      ourScore: 34,
      oppScore: 14,
      status: 'Final',
      highlights: 'Dominant conference opening road win against the Panthers!',
      stats: {
        periods: [
          { name: 'Q1', us: 10, them: 0 },
          { name: 'Q2', us: 10, them: 7 },
          { name: 'Q3', us: 7, them: 0 },
          { name: 'Q4', us: 7, them: 7 }
        ],
        playerOfTheGame: {
          name: 'Tate Bingham (#11)',
          stat: '3 Passing TD, 215 Pass YDS',
          avatar: 'TB'
        },
        teamStats: { totalYards: 390, passingYards: 215, rushingYards: 175, turnovers: 0 }
      }
    },
    {
      id: 'ss-fb-03',
      sport: 'Football',
      gender: 'Boys',
      level: 'Varsity',
      opponent: 'Shelley Russets',
      opponentMascot: 'Russets',
      locationType: 'Away',
      date: '2026-09-04',
      time: '7:00 PM',
      venueName: 'Shelley High Stadium',
      venueAddress: '570 W Fir St, Shelley, ID 83274',
      lat: 43.3768,
      lng: -112.1332,
      parkingInfo: 'East stadium parking lot. Student bus parking in designated lane.',
      ticketUrl: 'https://arbiterlive.com/Teams/Schedule/7063843?activeEntityId=22686',
      ourScore: null,
      oppScore: null,
      status: 'Upcoming',
      highlights: 'High-stakes battle against 4A district rival Shelley.',
      stats: null
    },
    {
      id: 'ss-fb-04',
      sport: 'Football',
      gender: 'Boys',
      level: 'Varsity',
      opponent: 'Star Valley Braves (WY)',
      opponentMascot: 'Braves',
      locationType: 'Home',
      date: '2026-09-11',
      time: '7:00 PM',
      venueName: 'Sugar-Salem Digger Stadium',
      venueAddress: '#1 Digger Dr, Sugar City, ID 83448',
      lat: 43.8744,
      lng: -111.7483,
      parkingInfo: 'High school campus parking lot. Tailgate & student section opens at 5:00 PM.',
      ticketUrl: 'https://sugarsalemhighschool.arbiterwebsites.com/',
      ourScore: null,
      oppScore: null,
      status: 'Upcoming',
      highlights: 'Interstate border rivalry showdown! Wear Blue & Gold spirit gear.',
      stats: null
    },
    {
      id: 'ss-fb-05',
      sport: 'Football',
      gender: 'Boys',
      level: 'Varsity',
      opponent: 'Kimberly Bulldogs',
      opponentMascot: 'Bulldogs',
      locationType: 'Home',
      date: '2026-09-18',
      time: '7:00 PM',
      venueName: 'Sugar-Salem Digger Stadium',
      venueAddress: '#1 Digger Dr, Sugar City, ID 83448',
      lat: 43.8744,
      lng: -111.7483,
      parkingInfo: 'Full campus parking open. Concession stand open with hot chocolate & burgers.',
      ticketUrl: 'https://sugarsalemhighschool.arbiterwebsites.com/',
      ourScore: null,
      oppScore: null,
      status: 'Upcoming',
      highlights: 'Non-conference marquee game under Friday night lights.',
      stats: null
    },
    {
      id: 'ss-fb-06',
      sport: 'Football',
      gender: 'Boys',
      level: 'Varsity',
      opponent: 'Preston Indians',
      opponentMascot: 'Indians',
      locationType: 'Home',
      date: '2026-09-25',
      time: '7:00 PM',
      venueName: 'Sugar-Salem Digger Stadium',
      venueAddress: '#1 Digger Dr, Sugar City, ID 83448',
      lat: 43.8744,
      lng: -111.7483,
      parkingInfo: 'Main high school athletic lot.',
      ticketUrl: 'https://sugarsalemhighschool.arbiterwebsites.com/',
      ourScore: null,
      oppScore: null,
      status: 'Upcoming',
      highlights: 'Homecoming Weekend 2026! Halftime coronation & spirit parade.',
      stats: null
    },
    {
      id: 'ss-fb-07',
      sport: 'Football',
      gender: 'Boys',
      level: 'Varsity',
      opponent: 'Teton Timberwolves',
      opponentMascot: 'Timberwolves',
      locationType: 'Home',
      date: '2026-10-09',
      time: '7:00 PM',
      venueName: 'Sugar-Salem Digger Stadium',
      venueAddress: '#1 Digger Dr, Sugar City, ID 83448',
      lat: 43.8744,
      lng: -111.7483,
      parkingInfo: 'Campus stadium lot. Senior Night recognition before kick-off.',
      ticketUrl: 'https://sugarsalemhighschool.arbiterwebsites.com/',
      ourScore: null,
      oppScore: null,
      status: 'Upcoming',
      highlights: 'Mountain Rivers Conference championship implications.',
      stats: null
    },
    {
      id: 'ss-fb-08',
      sport: 'Football',
      gender: 'Boys',
      level: 'Varsity',
      opponent: 'South Fremont Cougars',
      opponentMascot: 'Cougars',
      locationType: 'Away',
      date: '2026-10-16',
      time: '7:00 PM',
      venueName: 'South Fremont High Stadium',
      venueAddress: '855 N Bridge St, St Anthony, ID 83445',
      lat: 43.9740,
      lng: -111.6840,
      parkingInfo: 'Visitor parking on North side of high school campus.',
      ticketUrl: 'https://arbiterlive.com/Teams/Schedule/7063843?activeEntityId=22686',
      ourScore: null,
      oppScore: null,
      status: 'Upcoming',
      highlights: 'The Historic Highway 20 Rivalry Game! Diggers vs Cougars.',
      stats: null
    },

    // ==========================================
    // 2. VOLLEYBALL (Varsity & Tournaments)
    // ==========================================
    {
      id: 'ss-vb-01',
      sport: 'Volleyball',
      gender: 'Girls',
      level: 'Varsity',
      opponent: 'Peg Peterson Tournament (Fruitland, Filer, Century)',
      opponentMascot: 'Tournament',
      locationType: 'Away',
      date: '2026-08-22',
      time: '9:00 AM',
      venueName: 'Century High Gymnasium',
      venueAddress: '7801 Diamondback Way, Pocatello, ID 83201',
      lat: 42.8250,
      lng: -112.4150,
      parkingInfo: 'Gymnasium event parking available at Century HS.',
      ticketUrl: 'https://arbiterlive.com/Teams/Schedule/7754683?activeEntityId=22686',
      ourScore: 3,
      oppScore: 1,
      status: 'Final',
      highlights: 'Tournament bracket victory with great front-row blocking and serving runs.',
      stats: {
        periods: [
          { name: 'S1', us: 25, them: 21 },
          { name: 'S2', us: 23, them: 25 },
          { name: 'S3', us: 25, them: 18 },
          { name: 'S4', us: 25, them: 16 }
        ],
        playerOfTheGame: {
          name: 'Hailey Harris (#5)',
          stat: '18 Kills, 4 Aces, 14 Digs',
          avatar: 'HH'
        },
        teamStats: { kills: 48, aces: 9, blocks: 11, digs: 56 }
      }
    },
    {
      id: 'ss-vb-02',
      sport: 'Volleyball',
      gender: 'Girls',
      level: 'Varsity',
      opponent: 'Snake River Panthers',
      opponentMascot: 'Panthers',
      locationType: 'Away',
      date: '2026-09-01',
      time: '6:30 PM',
      venueName: 'Snake River High Gymnasium',
      venueAddress: '922 W Hwy 39, Blackfoot, ID 83221',
      lat: 43.2185,
      lng: -112.3920,
      parkingInfo: 'Park near the athletic wing entrance.',
      ticketUrl: 'https://arbiterlive.com/Teams/Schedule/7754683?activeEntityId=22686',
      ourScore: null,
      oppScore: null,
      status: 'Upcoming',
      highlights: 'Varsity conference battle follows JV at 5:00 PM.',
      stats: null
    },
    {
      id: 'ss-vb-03',
      sport: 'Volleyball',
      gender: 'Girls',
      level: 'Varsity',
      opponent: 'South Fremont Cougars',
      opponentMascot: 'Cougars',
      locationType: 'Home',
      date: '2026-09-03',
      time: '6:30 PM',
      venueName: 'Sugar-Salem High Main Gym',
      venueAddress: '#1 Digger Dr, Sugar City, ID 83448',
      lat: 43.8744,
      lng: -111.7483,
      parkingInfo: 'Main campus lot. Free student admission with ID.',
      ticketUrl: 'https://sugarsalemhighschool.arbiterwebsites.com/',
      ourScore: null,
      oppScore: null,
      status: 'Upcoming',
      highlights: 'Conference rivalry match at home in Sugar City.',
      stats: null
    },
    {
      id: 'ss-vb-04',
      sport: 'Volleyball',
      gender: 'Girls',
      level: 'Varsity',
      opponent: 'South Fremont Cougars',
      opponentMascot: 'Cougars',
      locationType: 'Away',
      date: '2026-09-08',
      time: '6:30 PM',
      venueName: 'South Fremont High Gymnasium',
      venueAddress: '855 N Bridge St, St Anthony, ID 83445',
      lat: 43.9740,
      lng: -111.6840,
      parkingInfo: 'South campus entrance, gym doors open at 4:30 PM.',
      ticketUrl: 'https://arbiterlive.com/Teams/Schedule/7754683?activeEntityId=22686',
      ourScore: null,
      oppScore: null,
      status: 'Upcoming',
      highlights: 'Cross-county conference rematch in St. Anthony.',
      stats: null
    },
    {
      id: 'ss-vb-05',
      sport: 'Volleyball',
      gender: 'Girls',
      level: 'Varsity',
      opponent: 'Teton Timberwolves',
      opponentMascot: 'Timberwolves',
      locationType: 'Home',
      date: '2026-09-15',
      time: '6:30 PM',
      venueName: 'Sugar-Salem High Main Gym',
      venueAddress: '#1 Digger Dr, Sugar City, ID 83448',
      lat: 43.8744,
      lng: -111.7483,
      parkingInfo: 'Main high school athletic parking lot.',
      ticketUrl: 'https://sugarsalemhighschool.arbiterwebsites.com/',
      ourScore: null,
      oppScore: null,
      status: 'Upcoming',
      highlights: 'Diggers Volley Spirit Night! Pack the gym in Royal Blue.',
      stats: null
    },
    {
      id: 'ss-vb-06',
      sport: 'Volleyball',
      gender: 'Girls',
      level: 'Varsity',
      opponent: 'Snake River Panthers',
      opponentMascot: 'Panthers',
      locationType: 'Home',
      date: '2026-09-22',
      time: '6:30 PM',
      venueName: 'Sugar-Salem High Main Gym',
      venueAddress: '#1 Digger Dr, Sugar City, ID 83448',
      lat: 43.8744,
      lng: -111.7483,
      parkingInfo: 'Main lot open, entrance through foyer doors.',
      ticketUrl: 'https://sugarsalemhighschool.arbiterwebsites.com/',
      ourScore: null,
      oppScore: null,
      status: 'Upcoming',
      highlights: 'Conference clash against the Lady Panthers at home.',
      stats: null
    },
    {
      id: 'ss-vb-07',
      sport: 'Volleyball',
      gender: 'Girls',
      level: 'Varsity',
      opponent: 'Filer Wildcats',
      opponentMascot: 'Wildcats',
      locationType: 'Away',
      date: '2026-09-26',
      time: '1:00 PM',
      venueName: 'Filer High Gymnasium',
      venueAddress: '3915 N Wildcat Way, Filer, ID 83328',
      lat: 42.5690,
      lng: -114.6110,
      parkingInfo: 'Wildcat athletic parking lot.',
      ticketUrl: 'https://arbiterlive.com/Teams/Schedule/7754683?activeEntityId=22686',
      ourScore: null,
      oppScore: null,
      status: 'Upcoming',
      highlights: 'Weekend tournament showcase match in Magic Valley.',
      stats: null
    },
    {
      id: 'ss-vb-08',
      sport: 'Volleyball',
      gender: 'Girls',
      level: 'Varsity',
      opponent: 'Butte County Pirates',
      opponentMascot: 'Pirates',
      locationType: 'Away',
      date: '2026-10-08',
      time: '6:00 PM',
      venueName: 'Butte County High Gym',
      venueAddress: '122 W Ethel St, Arco, ID 83213',
      lat: 43.6355,
      lng: -113.3015,
      parkingInfo: 'School parking lot in Arco.',
      ticketUrl: 'https://arbiterlive.com/Teams/Schedule/7754683?activeEntityId=22686',
      ourScore: null,
      oppScore: null,
      status: 'Upcoming',
      highlights: 'Regular season final road test before district playoffs.',
      stats: null
    },

    // ==========================================
    // 3. BOYS SOCCER
    // ==========================================
    {
      id: 'ss-bsc-01',
      sport: 'Soccer',
      gender: 'Boys',
      level: 'Varsity',
      opponent: 'Meridian Warriors',
      opponentMascot: 'Warriors',
      locationType: 'Away',
      date: '2026-08-22',
      time: '11:00 AM',
      venueName: 'Meridian High Soccer Field',
      venueAddress: '1900 W Pine Ave, Meridian, ID 83642',
      lat: 43.6120,
      lng: -116.4150,
      parkingInfo: 'High school west athletic parking lot.',
      ticketUrl: 'https://arbiterlive.com/Teams/Schedule/7576349?activeEntityId=22686',
      ourScore: 0,
      oppScore: 0,
      status: 'Final',
      highlights: 'Hard-fought defensive battle resulting in a clean sheet season opening draw.',
      stats: {
        periods: [
          { name: '1H', us: 0, them: 0 },
          { name: '2H', us: 0, them: 0 }
        ],
        playerOfTheGame: {
          name: 'Liam Vance (GK)',
          stat: '8 Saves, Clean Sheet',
          avatar: 'LV'
        },
        teamStats: { shotsOnGoal: 6, saves: 8, cornerKicks: 4, fouls: 7 }
      }
    },
    {
      id: 'ss-bsc-02',
      sport: 'Soccer',
      gender: 'Boys',
      level: 'Varsity',
      opponent: 'American Falls Beavers',
      opponentMascot: 'Beavers',
      locationType: 'Away',
      date: '2026-08-25',
      time: '4:30 PM',
      venueName: 'American Falls High Soccer Field',
      venueAddress: '2966 S Frontage Rd, American Falls, ID 83211',
      lat: 42.7840,
      lng: -112.8510,
      parkingInfo: 'Side stadium parking.',
      ticketUrl: 'https://arbiterlive.com/Teams/Schedule/7576349?activeEntityId=22686',
      ourScore: 7,
      oppScore: 1,
      status: 'Final',
      highlights: 'Explosive offensive showing with 7 goals scored on the road!',
      stats: {
        periods: [
          { name: '1H', us: 4, them: 1 },
          { name: '2H', us: 3, them: 0 }
        ],
        playerOfTheGame: {
          name: 'Mateo Ortiz (#10)',
          stat: '3 Goals (Hat Trick), 2 Assists',
          avatar: 'MO'
        },
        teamStats: { shotsOnGoal: 14, saves: 3, cornerKicks: 7, fouls: 5 }
      }
    },
    {
      id: 'ss-bsc-03',
      sport: 'Soccer',
      gender: 'Boys',
      level: 'Varsity',
      opponent: 'South Fremont Cougars',
      opponentMascot: 'Cougars',
      locationType: 'Home',
      date: '2026-09-03',
      time: '4:30 PM',
      venueName: 'Sugar-Salem Soccer Complex',
      venueAddress: '#1 Digger Dr, Sugar City, ID 83448',
      lat: 43.8744,
      lng: -111.7483,
      parkingInfo: 'Field parking located west of track & stadium.',
      ticketUrl: 'https://arbiterlive.com/Teams/Schedule/7576349?activeEntityId=22686',
      ourScore: null,
      oppScore: null,
      status: 'Upcoming',
      highlights: 'District 6 conference opener on home pitch.',
      stats: null
    },
    {
      id: 'ss-bsc-04',
      sport: 'Soccer',
      gender: 'Boys',
      level: 'Varsity',
      opponent: 'Teton Timberwolves',
      opponentMascot: 'Timberwolves',
      locationType: 'Home',
      date: '2026-09-17',
      time: '4:30 PM',
      venueName: 'Sugar-Salem Soccer Complex',
      venueAddress: '#1 Digger Dr, Sugar City, ID 83448',
      lat: 43.8744,
      lng: -111.7483,
      parkingInfo: 'West pitch parking area.',
      ticketUrl: 'https://arbiterlive.com/Teams/Schedule/7576349?activeEntityId=22686',
      ourScore: null,
      oppScore: null,
      status: 'Upcoming',
      highlights: 'Conference duel against Teton Timberwolves.',
      stats: null
    },

    // ==========================================
    // 4. GIRLS SOCCER
    // ==========================================
    {
      id: 'ss-gsc-01',
      sport: 'Soccer',
      gender: 'Girls',
      level: 'Varsity',
      opponent: 'Canyon Ridge Riverhawks',
      opponentMascot: 'Riverhawks',
      locationType: 'Away',
      date: '2026-08-29',
      time: '1:00 PM',
      venueName: 'Canyon Ridge High Soccer Field',
      venueAddress: '300 N College Rd W, Twin Falls, ID 83301',
      lat: 42.5850,
      lng: -114.4750,
      parkingInfo: 'North athletic parking lot.',
      ticketUrl: 'https://arbiterlive.com/Teams/Schedule/7576350?activeEntityId=22686',
      ourScore: 4,
      oppScore: 3,
      status: 'Final',
      highlights: 'Thrilling comeback victory with game-winning goal in the 78th minute!',
      stats: {
        periods: [
          { name: '1H', us: 1, them: 2 },
          { name: '2H', us: 3, them: 1 }
        ],
        playerOfTheGame: {
          name: 'Kaylee Sorenson (#9)',
          stat: '2 Goals, 1 Assist, Game-Winner',
          avatar: 'KS'
        },
        teamStats: { shotsOnGoal: 11, saves: 6, cornerKicks: 5, fouls: 6 }
      }
    },
    {
      id: 'ss-gsc-02',
      sport: 'Soccer',
      gender: 'Girls',
      level: 'Varsity',
      opponent: 'South Fremont Cougars',
      opponentMascot: 'Cougars',
      locationType: 'Away',
      date: '2026-09-03',
      time: '4:30 PM',
      venueName: 'South Fremont Soccer Field',
      venueAddress: '855 N Bridge St, St Anthony, ID 83445',
      lat: 43.9740,
      lng: -111.6840,
      parkingInfo: 'Park in south entrance near athletic track.',
      ticketUrl: 'https://arbiterlive.com/Teams/Schedule/7576350?activeEntityId=22686',
      ourScore: null,
      oppScore: null,
      status: 'Upcoming',
      highlights: 'Lady Diggers conference road opener in St. Anthony.',
      stats: null
    },
    {
      id: 'ss-gsc-03',
      sport: 'Soccer',
      gender: 'Girls',
      level: 'Varsity',
      opponent: 'Teton Timberwolves',
      opponentMascot: 'Timberwolves',
      locationType: 'Away',
      date: '2026-09-10',
      time: '4:30 PM',
      venueName: 'Teton High Soccer Field',
      venueAddress: '555 E Ross Ave, Driggs, ID 83422',
      lat: 43.7230,
      lng: -111.1030,
      parkingInfo: 'Parking adjacent to main high school gym & turf.',
      ticketUrl: 'https://arbiterlive.com/Teams/Schedule/7576350?activeEntityId=22686',
      ourScore: null,
      oppScore: null,
      status: 'Upcoming',
      highlights: 'Scenic Teton Valley road match for the Lady Diggers.',
      stats: null
    },
    {
      id: 'ss-gsc-04',
      sport: 'Soccer',
      gender: 'Girls',
      level: 'Varsity',
      opponent: 'Shelley Russets',
      opponentMascot: 'Russets',
      locationType: 'Home',
      date: '2026-09-24',
      time: '4:30 PM',
      venueName: 'Sugar-Salem Soccer Complex',
      venueAddress: '#1 Digger Dr, Sugar City, ID 83448',
      lat: 43.8744,
      lng: -111.7483,
      parkingInfo: 'Main school soccer lot.',
      ticketUrl: 'https://arbiterlive.com/Teams/Schedule/7576350?activeEntityId=22686',
      ourScore: null,
      oppScore: null,
      status: 'Upcoming',
      highlights: 'Non-conference battle under the afternoon sun.',
      stats: null
    },

    // ==========================================
    // 5. CROSS COUNTRY
    // ==========================================
    {
      id: 'ss-xc-01',
      sport: 'Cross Country',
      gender: 'Co-ed',
      level: 'Varsity',
      opponent: 'Tiger-Grizz Invitational',
      opponentMascot: 'Invitational',
      locationType: 'Away',
      date: '2026-09-12',
      time: '9:00 AM',
      venueName: 'Freeman Park Course',
      venueAddress: '1290 Science Center Dr, Idaho Falls, ID 83402',
      lat: 43.5075,
      lng: -112.0280,
      parkingInfo: 'Freeman Park upper parking lot and river overlook.',
      ticketUrl: 'https://arbiterlive.com/School/Calendar/22686',
      ourScore: null,
      oppScore: null,
      status: 'Upcoming',
      highlights: 'Premier Eastern Idaho cross country meet featuring over 30 regional schools.',
      stats: null
    },
    {
      id: 'ss-xc-02',
      sport: 'Cross Country',
      gender: 'Co-ed',
      level: 'Varsity',
      opponent: 'Bob Firman Invitational',
      opponentMascot: 'Invitational',
      locationType: 'Away',
      date: '2026-09-26',
      time: '9:00 AM',
      venueName: 'Eagle Island State Park',
      venueAddress: '165 S Eagle Island Pkwy, Eagle, ID 83616',
      lat: 43.6840,
      lng: -116.4150,
      parkingInfo: 'State Park entrance parking ($7 day pass or Idaho State Parks passport).',
      ticketUrl: 'https://arbiterlive.com/School/Calendar/22686',
      ourScore: null,
      oppScore: null,
      status: 'Upcoming',
      highlights: 'Nationally recognized high school cross country invitational.',
      stats: null
    },
    {
      id: 'ss-xc-03',
      sport: 'Cross Country',
      gender: 'Co-ed',
      level: 'Varsity',
      opponent: 'District 6 Championship Meet',
      opponentMascot: 'Districts',
      locationType: 'Away',
      date: '2026-10-22',
      time: '2:00 PM',
      venueName: 'Kelly Canyon Ski Course',
      venueAddress: '5488 E Kelly Canyon Rd, Ririe, ID 83443',
      lat: 43.6420,
      lng: -111.6320,
      parkingInfo: 'Base lodge parking area.',
      ticketUrl: 'https://arbiterlive.com/School/Calendar/22686',
      ourScore: null,
      oppScore: null,
      status: 'Upcoming',
      highlights: 'District 6 state qualifying championship race for Diggers runners.',
      stats: null
    },

    // ==========================================
    // 6. BOYS BASKETBALL (Winter Season)
    // ==========================================
    {
      id: 'ss-bbb-01',
      sport: 'Basketball',
      gender: 'Boys',
      level: 'Varsity',
      opponent: 'Shelley Russets',
      opponentMascot: 'Russets',
      locationType: 'Home',
      date: '2026-12-04',
      time: '7:30 PM',
      venueName: 'Sugar-Salem High Main Gym',
      venueAddress: '#1 Digger Dr, Sugar City, ID 83448',
      lat: 43.8744,
      lng: -111.7483,
      parkingInfo: 'Main campus lot. Pep band and cheerleaders performing live.',
      ticketUrl: 'https://arbiterlive.com/Teams/Schedule/7706395?activeEntityId=22686',
      ourScore: 68,
      oppScore: 54,
      status: 'Final',
      highlights: 'Dominant shooting performance with 11 three-pointers!',
      stats: {
        periods: [
          { name: 'Q1', us: 18, them: 12 },
          { name: 'Q2', us: 16, them: 14 },
          { name: 'Q3', us: 20, them: 13 },
          { name: 'Q4', us: 14, them: 15 }
        ],
        playerOfTheGame: {
          name: 'Carson Harris (#12)',
          stat: '24 PTS, 8 REB, 5 AST',
          avatar: 'CH'
        },
        teamStats: { fgPct: '51%', threePtPct: '42%', rebounds: 38, steals: 9 }
      }
    },
    {
      id: 'ss-bbb-02',
      sport: 'Basketball',
      gender: 'Boys',
      level: 'Varsity',
      opponent: 'Snake River Panthers',
      opponentMascot: 'Panthers',
      locationType: 'Away',
      date: '2026-12-11',
      time: '7:30 PM',
      venueName: 'Snake River High Gymnasium',
      venueAddress: '922 W Hwy 39, Blackfoot, ID 83221',
      lat: 43.2185,
      lng: -112.3920,
      parkingInfo: 'Athletic wing parking.',
      ticketUrl: 'https://arbiterlive.com/Teams/Schedule/7706395?activeEntityId=22686',
      ourScore: null,
      oppScore: null,
      status: 'Upcoming',
      highlights: 'Conference road matchup against the Panthers.',
      stats: null
    },
    {
      id: 'ss-bbb-03',
      sport: 'Basketball',
      gender: 'Boys',
      level: 'Varsity',
      opponent: 'South Fremont Cougars',
      opponentMascot: 'Cougars',
      locationType: 'Home',
      date: '2026-12-18',
      time: '7:30 PM',
      venueName: 'Sugar-Salem High Main Gym',
      venueAddress: '#1 Digger Dr, Sugar City, ID 83448',
      lat: 43.8744,
      lng: -111.7483,
      parkingInfo: 'Main campus lot. Pack the stands in Diggers gear.',
      ticketUrl: 'https://arbiterlive.com/Teams/Schedule/7706395?activeEntityId=22686',
      ourScore: null,
      oppScore: null,
      status: 'Upcoming',
      highlights: 'Annual Holiday Hoops rivalry game vs South Fremont!',
      stats: null
    },
    {
      id: 'ss-bbb-04',
      sport: 'Basketball',
      gender: 'Boys',
      level: 'Varsity',
      opponent: 'Teton Timberwolves',
      opponentMascot: 'Timberwolves',
      locationType: 'Away',
      date: '2027-01-08',
      time: '7:30 PM',
      venueName: 'Teton High Gymnasium',
      venueAddress: '555 E Ross Ave, Driggs, ID 83422',
      lat: 43.7230,
      lng: -111.1030,
      parkingInfo: 'Teton HS main gym parking lot.',
      ticketUrl: 'https://arbiterlive.com/Teams/Schedule/7706395?activeEntityId=22686',
      ourScore: null,
      oppScore: null,
      status: 'Upcoming',
      highlights: 'Winter conference road clash in Driggs.',
      stats: null
    },

    // ==========================================
    // 7. GIRLS BASKETBALL (Winter Season)
    // ==========================================
    {
      id: 'ss-gbb-01',
      sport: 'Basketball',
      gender: 'Girls',
      level: 'Varsity',
      opponent: 'South Fremont Cougars',
      opponentMascot: 'Cougars',
      locationType: 'Home',
      date: '2026-12-08',
      time: '7:30 PM',
      venueName: 'Sugar-Salem High Main Gym',
      venueAddress: '#1 Digger Dr, Sugar City, ID 83448',
      lat: 43.8744,
      lng: -111.7483,
      parkingInfo: 'Full parking available. Concessions open.',
      ticketUrl: 'https://arbiterlive.com/Teams/Schedule/7706392?activeEntityId=22686',
      ourScore: 56,
      oppScore: 48,
      status: 'Final',
      highlights: 'Lady Diggers clutch free throws in final minute to secure rivalry victory.',
      stats: {
        periods: [
          { name: 'Q1', us: 14, them: 11 },
          { name: 'Q2', us: 12, them: 13 },
          { name: 'Q3', us: 16, them: 12 },
          { name: 'Q4', us: 14, them: 12 }
        ],
        playerOfTheGame: {
          name: 'Aubrey Miller (#21)',
          stat: '21 PTS, 11 REB, 4 BLK',
          avatar: 'AM'
        },
        teamStats: { fgPct: '45%', threePtPct: '36%', rebounds: 42, steals: 7 }
      }
    },
    {
      id: 'ss-gbb-02',
      sport: 'Basketball',
      gender: 'Girls',
      level: 'Varsity',
      opponent: 'Snake River Panthers',
      opponentMascot: 'Panthers',
      locationType: 'Home',
      date: '2026-12-15',
      time: '7:30 PM',
      venueName: 'Sugar-Salem High Main Gym',
      venueAddress: '#1 Digger Dr, Sugar City, ID 83448',
      lat: 43.8744,
      lng: -111.7483,
      parkingInfo: 'High school gym parking lot.',
      ticketUrl: 'https://arbiterlive.com/Teams/Schedule/7706392?activeEntityId=22686',
      ourScore: null,
      oppScore: null,
      status: 'Upcoming',
      highlights: 'Key conference home game for the Lady Diggers.',
      stats: null
    },
    {
      id: 'ss-gbb-03',
      sport: 'Basketball',
      gender: 'Girls',
      level: 'Varsity',
      opponent: 'Teton Timberwolves',
      opponentMascot: 'Timberwolves',
      locationType: 'Away',
      date: '2027-01-12',
      time: '7:30 PM',
      venueName: 'Teton High Gymnasium',
      venueAddress: '555 E Ross Ave, Driggs, ID 83422',
      lat: 43.7230,
      lng: -111.1030,
      parkingInfo: 'Gym lot on East Ross Ave.',
      ticketUrl: 'https://arbiterlive.com/Teams/Schedule/7706392?activeEntityId=22686',
      ourScore: null,
      oppScore: null,
      status: 'Upcoming',
      highlights: 'Mountain Rivers Conference girls basketball showdown.',
      stats: null
    },

    // ==========================================
    // 8. WRESTLING (Winter Season)
    // ==========================================
    {
      id: 'ss-wr-01',
      sport: 'Wrestling',
      gender: 'Boys',
      level: 'Varsity',
      opponent: 'Sugar-Salem Digger Duals Invitational',
      opponentMascot: 'Duals',
      locationType: 'Home',
      date: '2026-12-05',
      time: '9:00 AM',
      venueName: 'Sugar-Salem High Main Gym',
      venueAddress: '#1 Digger Dr, Sugar City, ID 83448',
      lat: 43.8744,
      lng: -111.7483,
      parkingInfo: 'All campus parking open all day for tournament spectators.',
      ticketUrl: 'https://arbiterlive.com/Teams/Schedule/7657044?activeEntityId=22686',
      ourScore: null,
      oppScore: null,
      status: 'Upcoming',
      highlights: 'Annual 12-team wrestling invitational on multiple mats in Sugar City.',
      stats: null
    },
    {
      id: 'ss-wr-02',
      sport: 'Wrestling',
      gender: 'Boys',
      level: 'Varsity',
      opponent: 'Rollie Lane Invitational',
      opponentMascot: 'Invitational',
      locationType: 'Away',
      date: '2027-01-08',
      time: '8:00 AM',
      venueName: 'Ford Idaho Center',
      venueAddress: '16200 N Idaho Center Blvd, Nampa, ID 83687',
      lat: 43.6060,
      lng: -116.5050,
      parkingInfo: 'Ford Idaho Center arena parking ($5-$10).',
      ticketUrl: 'https://arbiterlive.com/Teams/Schedule/7657044?activeEntityId=22686',
      ourScore: null,
      oppScore: null,
      status: 'Upcoming',
      highlights: 'One of the most prestigious multi-state high school wrestling tournaments in the West.',
      stats: null
    },
    {
      id: 'ss-wr-03',
      sport: 'Wrestling',
      gender: 'Boys',
      level: 'Varsity',
      opponent: 'South Fremont & Teton Tri-Dual',
      opponentMascot: 'Tri-Dual',
      locationType: 'Away',
      date: '2027-01-28',
      time: '5:30 PM',
      venueName: 'South Fremont High Gymnasium',
      venueAddress: '855 N Bridge St, St Anthony, ID 83445',
      lat: 43.9740,
      lng: -111.6840,
      parkingInfo: 'High school parking lot in St. Anthony.',
      ticketUrl: 'https://arbiterlive.com/Teams/Schedule/7657044?activeEntityId=22686',
      ourScore: null,
      oppScore: null,
      status: 'Upcoming',
      highlights: 'Conference dual meet championship decider.',
      stats: null
    },

    // ==========================================
    // 9. BASEBALL & SOFTBALL (Spring Season)
    // ==========================================
    {
      id: 'ss-bsb-01',
      sport: 'Baseball',
      gender: 'Boys',
      level: 'Varsity',
      opponent: 'Shelley Russets',
      opponentMascot: 'Russets',
      locationType: 'Home',
      date: '2027-03-24',
      time: '4:00 PM',
      venueName: 'Sugar-Salem Baseball Diamond',
      venueAddress: '#1 Digger Dr, Sugar City, ID 83448',
      lat: 43.8744,
      lng: -111.7483,
      parkingInfo: 'East parking lot next to varsity diamond and dugouts.',
      ticketUrl: 'https://arbiterlive.com/Teams/Schedule/7660358?activeEntityId=22686',
      ourScore: null,
      oppScore: null,
      status: 'Upcoming',
      highlights: 'Opening day of the 2027 Diggers Baseball season!',
      stats: null
    },
    {
      id: 'ss-bsb-02',
      sport: 'Baseball',
      gender: 'Boys',
      level: 'Varsity',
      opponent: 'South Fremont Cougars',
      opponentMascot: 'Cougars',
      locationType: 'Away',
      date: '2027-04-07',
      time: '4:00 PM',
      venueName: 'South Fremont Baseball Field',
      venueAddress: '855 N Bridge St, St Anthony, ID 83445',
      lat: 43.9740,
      lng: -111.6840,
      parkingInfo: 'Cougar baseball diamond parking.',
      ticketUrl: 'https://arbiterlive.com/Teams/Schedule/7660358?activeEntityId=22686',
      ourScore: null,
      oppScore: null,
      status: 'Upcoming',
      highlights: 'Rivalry conference baseball series opener.',
      stats: null
    },
    {
      id: 'ss-sfb-01',
      sport: 'Softball',
      gender: 'Girls',
      level: 'Varsity',
      opponent: 'Snake River Panthers',
      opponentMascot: 'Panthers',
      locationType: 'Home',
      date: '2027-03-30',
      time: '4:00 PM',
      venueName: 'Sugar-Salem Softball Field',
      venueAddress: '#1 Digger Dr, Sugar City, ID 83448',
      lat: 43.8744,
      lng: -111.7483,
      parkingInfo: 'Softball complex spectator lot.',
      ticketUrl: 'https://arbiterlive.com/Teams/Schedule/7689212?activeEntityId=22686',
      ourScore: null,
      oppScore: null,
      status: 'Upcoming',
      highlights: 'Lady Diggers Softball season home opener.',
      stats: null
    },
    {
      id: 'ss-sfb-02',
      sport: 'Softball',
      gender: 'Girls',
      level: 'Varsity',
      opponent: 'Teton Timberwolves',
      opponentMascot: 'Timberwolves',
      locationType: 'Away',
      date: '2027-04-14',
      time: '4:00 PM',
      venueName: 'Teton High Softball Diamond',
      venueAddress: '555 E Ross Ave, Driggs, ID 83422',
      lat: 43.7230,
      lng: -111.1030,
      parkingInfo: 'Driggs campus parking.',
      ticketUrl: 'https://arbiterlive.com/Teams/Schedule/7689212?activeEntityId=22686',
      ourScore: null,
      oppScore: null,
      status: 'Upcoming',
      highlights: 'Conference softball road battle in Teton Valley.',
      stats: null
    },

    // ==========================================
    // 10. TRACK & FIELD (Spring Season)
    // ==========================================
    {
      id: 'ss-tr-01',
      sport: 'Track & Field',
      gender: 'Co-ed',
      level: 'Varsity',
      opponent: 'Sugar-Salem Track Invitational',
      opponentMascot: 'Invitational',
      locationType: 'Home',
      date: '2027-04-10',
      time: '10:00 AM',
      venueName: 'Sugar-Salem Digger Stadium',
      venueAddress: '#1 Digger Dr, Sugar City, ID 83448',
      lat: 43.8744,
      lng: -111.7483,
      parkingInfo: 'Main campus lot. Concessions open all day.',
      ticketUrl: 'https://arbiterlive.com/Teams/Schedule/11667996?activeEntityId=22686',
      ourScore: null,
      oppScore: null,
      status: 'Upcoming',
      highlights: 'Home track and field invitational featuring running, jumps, throws, and relays.',
      stats: null
    },
    {
      id: 'ss-tr-02',
      sport: 'Track & Field',
      gender: 'Co-ed',
      level: 'Varsity',
      opponent: 'District 6 Track Championships',
      opponentMascot: 'Districts',
      locationType: 'Away',
      date: '2027-05-13',
      time: '1:00 PM',
      venueName: 'Rigby High Track Stadium',
      venueAddress: '3850 E 300 N, Rigby, ID 83442',
      lat: 43.6820,
      lng: -111.8950,
      parkingInfo: 'Rigby HS stadium parking lot.',
      ticketUrl: 'https://arbiterlive.com/Teams/Schedule/11667996?activeEntityId=22686',
      ourScore: null,
      oppScore: null,
      status: 'Upcoming',
      highlights: 'State qualification championship meet for track and field athletes.',
      stats: null
    },

    // ==========================================
    // 11. TENNIS (Spring Season)
    // ==========================================
    {
      id: 'ss-tn-01',
      sport: 'Tennis',
      gender: 'Co-ed',
      level: 'Varsity',
      opponent: 'South Fremont Cougars',
      opponentMascot: 'Cougars',
      locationType: 'Home',
      date: '2027-04-06',
      time: '3:30 PM',
      venueName: 'Sugar-Salem Tennis Courts',
      venueAddress: '#1 Digger Dr, Sugar City, ID 83448',
      lat: 43.8744,
      lng: -111.7483,
      parkingInfo: 'Courtside parking lot.',
      ticketUrl: 'https://arbiterlive.com/Teams/Schedule/11681949?activeEntityId=22686',
      ourScore: null,
      oppScore: null,
      status: 'Upcoming',
      highlights: 'Diggers Tennis home opener with singles and doubles matches.',
      stats: null
    },
    {
      id: 'ss-tn-02',
      sport: 'Tennis',
      gender: 'Co-ed',
      level: 'Varsity',
      opponent: 'Teton Timberwolves',
      opponentMascot: 'Timberwolves',
      locationType: 'Away',
      date: '2027-04-20',
      time: '3:30 PM',
      venueName: 'Teton High Tennis Complex',
      venueAddress: '555 E Ross Ave, Driggs, ID 83422',
      lat: 43.7230,
      lng: -111.1030,
      parkingInfo: 'Driggs campus parking.',
      ticketUrl: 'https://arbiterlive.com/Teams/Schedule/11681949?activeEntityId=22686',
      ourScore: null,
      oppScore: null,
      status: 'Upcoming',
      highlights: 'Conference tennis match in Driggs.',
      stats: null
    },

    // ==========================================
    // 12. CHEER, DANCE & FINE ARTS CALENDAR
    // ==========================================
    {
      id: 'ss-cl-01',
      sport: 'Cheer & Clubs',
      gender: 'Co-ed',
      level: 'Varsity',
      opponent: 'Idaho State Spirit & Cheer Showcase',
      opponentMascot: 'State Spirit',
      locationType: 'Away',
      date: '2026-11-14',
      time: '1:00 PM',
      venueName: 'Hero Arena at the Mountain America Center',
      venueAddress: '1690 Event Center Dr, Idaho Falls, ID 83402',
      lat: 43.4912,
      lng: -112.0620,
      parkingInfo: 'MAC Event Center surface parking ($5).',
      ticketUrl: 'https://hs.sugarsalem.org/finearts',
      ourScore: null,
      oppScore: null,
      status: 'Upcoming',
      highlights: 'Sugar-Salem Cheer & Dance teams competing for State Championship bid.',
      stats: null
    },
    {
      id: 'ss-fa-01',
      sport: 'Fine Arts',
      gender: 'All',
      level: 'All School',
      opponent: 'Sugar-Salem High Fall Band & Choir Concert',
      opponentMascot: 'Music Department',
      locationType: 'Home',
      date: '2026-10-20',
      time: '7:00 PM',
      venueName: 'Sugar-Salem High Auditorium',
      venueAddress: '#1 Digger Dr, Sugar City, ID 83448',
      lat: 43.8744,
      lng: -111.7483,
      parkingInfo: 'Auditorium entrance on south wing of campus. Free admission.',
      ticketUrl: 'https://hs.sugarsalem.org/finearts',
      ourScore: null,
      oppScore: null,
      status: 'Upcoming',
      highlights: 'Annual Fall Music Department performance featuring Symphonic Band, Jazz Band, and Concert Choirs.',
      stats: null
    },
    {
      id: 'ss-fa-02',
      sport: 'Fine Arts',
      gender: 'All',
      level: 'All School',
      opponent: 'Sugar-Salem High Winter Holiday Gala',
      opponentMascot: 'Holiday Gala',
      locationType: 'Home',
      date: '2026-12-16',
      time: '7:00 PM',
      venueName: 'Sugar-Salem High Auditorium',
      venueAddress: '#1 Digger Dr, Sugar City, ID 83448',
      lat: 43.8744,
      lng: -111.7483,
      parkingInfo: 'Main auditorium parking lot.',
      ticketUrl: 'https://hs.sugarsalem.org/finearts',
      ourScore: null,
      oppScore: null,
      status: 'Upcoming',
      highlights: 'Community holiday performance with orchestral, vocal, and drama presentations.',
      stats: null
    }
  ];

  // Helper function to get relative dates formatted YYYY-MM-DD
  function getRelativeDate(offsetDays) {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Parse CSV formatted text into game objects
  function parseCSV(csvText) {
    if (!csvText || !csvText.trim()) return [];
    const lines = csvText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length < 2) return [];

    function splitCSVLine(line) {
      let processed = line;
      if (processed.startsWith('"') && processed.endsWith('"') && (processed.match(/"/g) || []).length === 2) {
        processed = processed.slice(1, -1);
      }

      const cells = [];
      let current = '';
      let inQuotes = false;

      for (let i = 0; i < processed.length; i++) {
        const char = processed[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          cells.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      cells.push(current.trim());
      return cells.map(c => c.replace(/^"(.*)"$/, '$1').trim());
    }

    const headerCells = splitCSVLine(lines[0]);
    const headers = headerCells.map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
    const results = [];

    const MONTH_MAP = {
      'january': '01', 'february': '02', 'march': '03', 'april': '04',
      'may': '05', 'june': '06', 'july': '07', 'august': '08',
      'september': '09', 'october': '10', 'november': '11', 'december': '12',
      'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04', 'jun': '06',
      'jul': '07', 'aug': '08', 'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12'
    };

    const monthDayCounters = {};

    for (let i = 1; i < lines.length; i++) {
      const row = splitCSVLine(lines[i]);
      if (row.length === 0 || row.every(c => !c)) continue;

      const item = {
        id: 'sheet-evt-' + i,
        sport: 'Other',
        gender: 'Boys',
        level: 'Varsity',
        opponent: '',
        opponentMascot: '',
        locationType: 'Home',
        date: getRelativeDate(0),
        time: '7:00 PM',
        venueName: 'Sugar-Salem High School',
        venueAddress: '#1 Digger Dr, Sugar City, ID 83448',
        lat: 43.8744,
        lng: -111.7483,
        parkingInfo: 'Standard spectator parking available.',
        ticketUrl: 'https://sugarsalemhighschool.arbiterwebsites.com/',
        ourScore: null,
        oppScore: null,
        status: 'Upcoming',
        highlights: '',
        stats: null
      };

      headers.forEach((header, index) => {
        const val = row[index];
        if (val === undefined || val === '') return;

        if (header.includes('date')) {
          item.date = val;
        } else if (header.includes('month')) {
          const parts = val.split(/\s+/);
          const monthKey = parts[0]?.toLowerCase();
          const year = parts[1] || '2026';
          if (MONTH_MAP[monthKey]) {
            const m = MONTH_MAP[monthKey];
            monthDayCounters[val] = (monthDayCounters[val] || 0) + 1;
            const dayNum = Math.min(28, monthDayCounters[val]);
            const dayStr = String(dayNum).padStart(2, '0');
            item.date = `${year}-${m}-${dayStr}`;
          }
        }

        if (header.includes('sport')) {
          let sportText = val;
          if (/freshman/i.test(sportText)) item.level = 'Freshman';
          else if (/junior varsity|jv/i.test(sportText)) item.level = 'Junior Varsity';
          else if (/c-team|c team/i.test(sportText)) item.level = 'C-Team';
          else if (/varsity/i.test(sportText)) item.level = 'Varsity';

          if (/girls/i.test(sportText)) item.gender = 'Girls';
          else if (/coed/i.test(sportText)) item.gender = 'Coed';
          else if (/boys/i.test(sportText)) item.gender = 'Boys';

          if (/football/i.test(sportText)) item.sport = 'Football';
          else if (/volleyball/i.test(sportText)) item.sport = 'Volleyball';
          else if (/soccer/i.test(sportText)) item.sport = 'Soccer';
          else if (/basketball/i.test(sportText)) item.sport = 'Basketball';
          else if (/cross country|xc/i.test(sportText)) item.sport = 'Cross Country';
          else if (/wrestling/i.test(sportText)) item.sport = 'Wrestling';
          else if (/baseball/i.test(sportText)) item.sport = 'Baseball';
          else if (/softball/i.test(sportText)) item.sport = 'Softball';
          else if (/track/i.test(sportText)) item.sport = 'Track & Field';
          else item.sport = sportText.replace(/varsity|junior|freshman|c-team|boys|girls|coed/gi, '').trim() || 'Other';
        }

        if (header.includes('opp') || header.includes('team') || header.includes('opponentlocation')) {
          let oppText = val.trim();
          if (oppText.startsWith('vs.') || oppText.startsWith('vs ') || oppText.startsWith('vs:')) {
            item.locationType = 'Home';
            oppText = oppText.replace(/^vs\.?\s*:?\s*/i, '');
          } else if (oppText.startsWith('at ') || oppText.startsWith('@ ') || oppText.startsWith('at:')) {
            item.locationType = 'Away';
            oppText = oppText.replace(/^(at|@)\s*:?\s*/i, '');
          }

          if (oppText) {
            item.opponent = oppText;
            if (item.locationType === 'Away') {
              item.venueName = oppText.endsWith('Stadium') || oppText.endsWith('Gym') ? oppText : `${oppText} Stadium`;
              item.venueAddress = `${oppText}, ID`;
            }
          }
        }

        if (header.includes('time')) {
          let timeText = val.trim();
          if (/^\d{1,2}:\d{2}[ap]/i.test(timeText)) {
            const startPart = timeText.split('-')[0].trim();
            const match = startPart.match(/^(\d{1,2}):(\d{2})([ap])/i);
            if (match) {
              const ampm = match[3].toLowerCase() === 'p' ? 'PM' : 'AM';
              timeText = `${match[1]}:${match[2]} ${ampm}`;
            }
          }
          item.time = timeText;
        }

        if (header.includes('loc') && !header.includes('opponent')) {
          item.locationType = val.toLowerCase().includes('home') ? 'Home' : 'Away';
        }
        if (header.includes('venue') || header.includes('stadium')) item.venueName = val;
        if (header.includes('addr')) item.venueAddress = val;
        if (header.includes('ourscore') || header === 'us' || header === 'score') item.ourScore = isNaN(parseInt(val)) ? null : parseInt(val);
        if (header.includes('oppscore') || header === 'them') item.oppScore = isNaN(parseInt(val)) ? null : parseInt(val);
        if (header.includes('status')) item.status = val;
        if (header.includes('note') || header.includes('highlight')) item.highlights = val;
        if (header.includes('lat')) item.lat = parseFloat(val) || 43.8744;
        if (header.includes('lng') || header.includes('lon')) item.lng = parseFloat(val) || -111.7483;
      });

      if (!item.opponent) {
        item.opponent = `${item.sport} Event`;
      }

      if (!item.status || item.status === 'Upcoming') {
        if (item.ourScore !== null && item.oppScore !== null) {
          item.status = 'Final';
        }
      }

      results.push(item);
    }

    return results;
  }

  // Parse OpenSheet JSON response
  function parseOpenSheetJson(jsonArray) {
    if (!Array.isArray(jsonArray) || jsonArray.length === 0) return [];
    const firstObj = jsonArray[0];
    const keys = Object.keys(firstObj);

    if (keys.length === 1 && keys[0].includes(',')) {
      const headerLine = keys[0];
      const dataLines = jsonArray.map(obj => obj[headerLine] || '').filter(l => l.trim().length > 0);
      return parseCSV([headerLine, ...dataLines].join('\n'));
    }

    const csvLines = [];
    csvLines.push(keys.join(','));
    jsonArray.forEach(row => {
      const vals = keys.map(k => `"${String(row[k] || '').replace(/"/g, '""')}"`);
      csvLines.push(vals.join(','));
    });
    return parseCSV(csvLines.join('\n'));
  }

  // Fetch Google Sheet data using high-reliability CORS-compatible endpoints
  async function fetchGoogleSheetData(sheetId, gid = '') {
    const sources = [
      `https://opensheet.elk.sh/${sheetId}/${gid || '1'}`,
      `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv${gid ? `&gid=${gid}` : ''}`
    ];

    let lastError = null;

    for (const source of sources) {
      try {
        const response = await fetch(source);
        if (!response.ok) continue;
        const text = await response.text();

        // If JSON from OpenSheet
        if (text.trim().startsWith('[') || text.trim().startsWith('{')) {
          try {
            const data = JSON.parse(text);
            if (Array.isArray(data) && data.length > 0) {
              const parsed = parseOpenSheetJson(data);
              if (parsed.length > 0) return parsed;
            }
          } catch (e) {}
        }

        // If CSV from gviz
        const parsed = parseCSV(text);
        if (parsed.length > 0) return parsed;
      } catch (err) {
        lastError = err;
      }
    }

    throw lastError || new Error('Could not retrieve data from Google Sheet. Make sure General Access is set to "Anyone with the link can view".');
  }

  // Parse GViz Table object into game events array
  function parseGvizTable(table) {
    if (!table || !table.rows || table.rows.length === 0) return [];

    // Check if first row is a composite CSV line
    const firstRowCell = table.rows[0]?.c?.[0]?.v || '';
    if (typeof firstRowCell === 'string' && firstRowCell.includes(',')) {
      const allLines = table.rows
        .map(r => (r.c && r.c[0] && r.c[0].v !== null && r.c[0].v !== undefined) ? String(r.c[0].v) : '')
        .filter(l => l.trim().length > 0);
      return parseCSV(allLines.join('\n'));
    }

    const colLabels = (table.cols || []).map(c => (c.label || c.id || '').trim());
    const headers = colLabels.map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
    const results = [];

    const MONTH_MAP = {
      'january': '01', 'february': '02', 'march': '03', 'april': '04',
      'may': '05', 'june': '06', 'july': '07', 'august': '08',
      'september': '09', 'october': '10', 'november': '11', 'december': '12',
      'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04', 'jun': '06',
      'jul': '07', 'aug': '08', 'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12'
    };
    const monthDayCounters = {};

    table.rows.forEach((rowObj, rowIdx) => {
      if (!rowObj || !rowObj.c) return;
      const rowValues = rowObj.c.map(cell => cell ? (cell.v !== null && cell.v !== undefined ? String(cell.v).trim() : '') : '');
      if (rowValues.every(v => !v)) return;

      const item = {
        id: 'sheet-evt-' + (rowIdx + 1),
        sport: 'Other',
        gender: 'Boys',
        level: 'Varsity',
        opponent: '',
        opponentMascot: '',
        locationType: 'Home',
        date: getRelativeDate(0),
        time: '7:00 PM',
        venueName: 'Sugar-Salem High School',
        venueAddress: '#1 Digger Dr, Sugar City, ID 83448',
        lat: 43.8744,
        lng: -111.7483,
        parkingInfo: 'Standard spectator parking available.',
        ticketUrl: 'https://sugarsalemhighschool.arbiterwebsites.com/',
        ourScore: null,
        oppScore: null,
        status: 'Upcoming',
        highlights: '',
        stats: null
      };

      headers.forEach((header, index) => {
        const val = rowValues[index];
        if (val === undefined || val === '') return;

        if (header.includes('date')) {
          item.date = val;
        } else if (header.includes('month')) {
          const parts = val.split(/\s+/);
          const monthKey = parts[0]?.toLowerCase();
          const year = parts[1] || '2026';
          if (MONTH_MAP[monthKey]) {
            const m = MONTH_MAP[monthKey];
            monthDayCounters[val] = (monthDayCounters[val] || 0) + 1;
            const dayNum = Math.min(28, monthDayCounters[val]);
            const dayStr = String(dayNum).padStart(2, '0');
            item.date = `${year}-${m}-${dayStr}`;
          }
        }

        if (header.includes('sport')) {
          let sportText = val;
          if (/freshman/i.test(sportText)) item.level = 'Freshman';
          else if (/junior varsity|jv/i.test(sportText)) item.level = 'Junior Varsity';
          else if (/c-team|c team/i.test(sportText)) item.level = 'C-Team';
          else if (/varsity/i.test(sportText)) item.level = 'Varsity';

          if (/girls/i.test(sportText)) item.gender = 'Girls';
          else if (/coed/i.test(sportText)) item.gender = 'Coed';
          else if (/boys/i.test(sportText)) item.gender = 'Boys';

          if (/football/i.test(sportText)) item.sport = 'Football';
          else if (/volleyball/i.test(sportText)) item.sport = 'Volleyball';
          else if (/soccer/i.test(sportText)) item.sport = 'Soccer';
          else if (/basketball/i.test(sportText)) item.sport = 'Basketball';
          else if (/cross country|xc/i.test(sportText)) item.sport = 'Cross Country';
          else if (/wrestling/i.test(sportText)) item.sport = 'Wrestling';
          else if (/baseball/i.test(sportText)) item.sport = 'Baseball';
          else if (/softball/i.test(sportText)) item.sport = 'Softball';
          else if (/track/i.test(sportText)) item.sport = 'Track & Field';
          else item.sport = sportText.replace(/varsity|junior|freshman|c-team|boys|girls|coed/gi, '').trim() || 'Other';
        }

        if (header.includes('opp') || header.includes('team') || header.includes('opponentlocation')) {
          let oppText = val.trim();
          if (oppText.startsWith('vs.') || oppText.startsWith('vs ') || oppText.startsWith('vs:')) {
            item.locationType = 'Home';
            oppText = oppText.replace(/^vs\.?\s*:?\s*/i, '');
          } else if (oppText.startsWith('at ') || oppText.startsWith('@ ') || oppText.startsWith('at:')) {
            item.locationType = 'Away';
            oppText = oppText.replace(/^(at|@)\s*:?\s*/i, '');
          }

          if (oppText) {
            item.opponent = oppText;
            if (item.locationType === 'Away') {
              item.venueName = oppText.endsWith('Stadium') || oppText.endsWith('Gym') ? oppText : `${oppText} Stadium`;
              item.venueAddress = `${oppText}, ID`;
            }
          }
        }

        if (header.includes('time')) {
          let timeText = val.trim();
          if (/^\d{1,2}:\d{2}[ap]/i.test(timeText)) {
            const startPart = timeText.split('-')[0].trim();
            const match = startPart.match(/^(\d{1,2}):(\d{2})([ap])/i);
            if (match) {
              const ampm = match[3].toLowerCase() === 'p' ? 'PM' : 'AM';
              timeText = `${match[1]}:${match[2]} ${ampm}`;
            }
          }
          item.time = timeText;
        }

        if (header.includes('loc') && !header.includes('opponent')) {
          item.locationType = val.toLowerCase().includes('home') ? 'Home' : 'Away';
        }
        if (header.includes('venue') || header.includes('stadium')) item.venueName = val;
        if (header.includes('addr')) item.venueAddress = val;
        if (header.includes('ourscore') || header === 'us' || header === 'score') item.ourScore = isNaN(parseInt(val)) ? null : parseInt(val);
        if (header.includes('oppscore') || header === 'them') item.oppScore = isNaN(parseInt(val)) ? null : parseInt(val);
        if (header.includes('status')) item.status = val;
        if (header.includes('note') || header.includes('highlight')) item.highlights = val;
        if (header.includes('lat')) item.lat = parseFloat(val) || 43.8744;
        if (header.includes('lng') || header.includes('lon')) item.lng = parseFloat(val) || -111.7483;
      });

      if (!item.opponent) {
        item.opponent = `${item.sport} Event`;
      }
      if (!item.status || item.status === 'Upcoming') {
        if (item.ourScore !== null && item.oppScore !== null) {
          item.status = 'Final';
        }
      }

      results.push(item);
    });

    return results;
  }

  async function fetchLiveJsonEvents() {
    const url = localStorage.getItem(STORAGE_KEY_SHEET_URL) || DEFAULT_LIVE_DATA_URL;
    try {
      const response = await fetch(url);
      if (!response.ok) return null;
      const data = await response.json();
      const events = Array.isArray(data) ? data : (Array.isArray(data.events) ? data.events : null);
      return events && events.length ? events : null;
    } catch (err) {
      return null;
    }
  }

  // Load events from LocalStorage cache, custom sheet, JSON sync file, or Sugar-Salem dataset
  async function loadEvents() {
    const schoolParam = new URLSearchParams(window.location.search).get('school');
    const savedUrl = localStorage.getItem(STORAGE_KEY_SHEET_URL);

    if (savedUrl) {
      const gSheetMatch = savedUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      if (gSheetMatch && gSheetMatch[1]) {
        try {
          const gidMatch = savedUrl.match(/[#&?]gid=([0-9]+)/);
          const gid = gidMatch ? gidMatch[1] : '';
          const table = await fetchGoogleSheetJSONP(gSheetMatch[1], gid);
          const parsed = parseGvizTable(table);
          if (parsed && parsed.length > 0) {
            localStorage.setItem(STORAGE_KEY_CUSTOM_DATA, JSON.stringify(parsed));
            return { events: parsed, isLiveSheet: true };
          }
        } catch (err) {
          console.warn('Could not refresh live Google Sheet via JSONP, using cache.', err);
          const cached = localStorage.getItem(STORAGE_KEY_CUSTOM_DATA);
          if (cached) {
            try {
              return { events: JSON.parse(cached), isLiveSheet: true };
            } catch (e) {}
          }
        }
      } else {
        try {
          const response = await fetch(savedUrl);
          if (response.ok) {
            const text = await response.text();
            if (text.trim().startsWith('[') || text.trim().startsWith('{')) {
              const json = JSON.parse(text);
              const parsed = Array.isArray(json) ? json : (Array.isArray(json.events) ? json.events : null);
              if (parsed && parsed.length > 0) {
                localStorage.setItem(STORAGE_KEY_CUSTOM_DATA, JSON.stringify(parsed));
                return { events: parsed, isLiveSheet: true };
              }
            }
            const parsed = parseCSV(text);
            if (parsed.length > 0) {
              localStorage.setItem(STORAGE_KEY_CUSTOM_DATA, JSON.stringify(parsed));
              return { events: parsed, isLiveSheet: true };
            }
          }
        } catch (err) {
          console.warn('Could not fetch custom URL, trying cache.', err);
        }
      }
    }

    const liveData = await fetchLiveJsonEvents();
    if (liveData) {
      localStorage.setItem(STORAGE_KEY_CUSTOM_DATA, JSON.stringify(liveData));
      return { events: liveData, isLiveSheet: true };
    }

    if (schoolParam === 'snake-river') {
      return { events: snakeRiverGames, isLiveSheet: false };
    }

    // Always use official Sugar-Salem schedule by default
    return { events: DEFAULT_EVENTS, isLiveSheet: false };
  }

  async function syncCustomSheetUrl(url) {
    if (!url || !url.trim()) {
      localStorage.removeItem(STORAGE_KEY_SHEET_URL);
      localStorage.removeItem(STORAGE_KEY_CUSTOM_DATA);
      return { success: true, count: DEFAULT_EVENTS.length, events: DEFAULT_EVENTS, isLive: false };
    }

    const cleanUrl = url.trim();
    const gSheetMatch = cleanUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);

    if (gSheetMatch && gSheetMatch[1]) {
      const sheetId = gSheetMatch[1];
      const gidMatch = cleanUrl.match(/[#&?]gid=([0-9]+)/);
      const gid = gidMatch ? gidMatch[1] : '';

      try {
        const table = await fetchGoogleSheetJSONP(sheetId, gid);
        const parsed = parseGvizTable(table);
        if (parsed.length === 0) {
          throw new Error('No valid event rows found in Google Sheet');
        }

        localStorage.setItem(STORAGE_KEY_SHEET_URL, cleanUrl);
        localStorage.setItem(STORAGE_KEY_CUSTOM_DATA, JSON.stringify(parsed));
        return { success: true, count: parsed.length, events: parsed, isLive: true };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }

    // Fallback for direct JSON / CSV HTTP URLs
    try {
      const response = await fetch(cleanUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to retrieve data`);
      }
      const text = await response.text();
      let parsed = [];
      if (text.trim().startsWith('[') || text.trim().startsWith('{')) {
        const json = JSON.parse(text);
        parsed = Array.isArray(json) ? json : (Array.isArray(json.events) ? json.events : []);
      } else {
        parsed = parseCSV(text);
      }

      if (parsed.length === 0) {
        throw new Error('No valid event rows found');
      }

      localStorage.setItem(STORAGE_KEY_SHEET_URL, cleanUrl);
      localStorage.setItem(STORAGE_KEY_CUSTOM_DATA, JSON.stringify(parsed));
      return { success: true, count: parsed.length, events: parsed, isLive: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  function resetToSampleData() {
    localStorage.removeItem(STORAGE_KEY_SHEET_URL);
    localStorage.removeItem(STORAGE_KEY_CUSTOM_DATA);
    return DEFAULT_EVENTS;
  }

  function getSavedSheetUrl() {
    return localStorage.getItem(STORAGE_KEY_SHEET_URL) || '';
  }

  return {
    loadEvents,
    syncCustomSheetUrl,
    resetToSampleData,
    getSavedSheetUrl,
    DEFAULT_EVENTS,
    snakeRiverGames
  };
})();

// Export globally
window.SheetsSync = SheetsSync;
