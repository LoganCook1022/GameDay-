/**
 * GameDay+ - Interactive Stadium & Away Games Map Module
 * Powered by Leaflet & OpenStreetMap with custom pins & 1-click GPS routing
 */

const GameDayMap = (function() {
  let mapInstance = null;
  let markersLayer = null;
  let currentVenues = [];
  let venuesExpanded = false;

  let HOME_COORDS = window.GameDayFirebase?.getSchoolMeta?.() || {
    lat: 43.8744,
    lng: -111.7483,
    venueName: 'Home School'
  };

  function initMap() {
    if (mapInstance) return;

    const mapElement = document.getElementById('leafletMap');
    if (!mapElement) return;

    // Center near school coordinates
    mapInstance = L.map('leafletMap', {
      zoomControl: true,
      scrollWheelZoom: true
    }).setView([HOME_COORDS.lat, HOME_COORDS.lng], 11);

    // OpenStreetMap high contrast, clean tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(mapInstance);

    markersLayer = L.layerGroup().addTo(mapInstance);

    // Close overlay button listener
    const closeBtn = document.getElementById('closeMapOverlayBtn');
    if (closeBtn) {
      closeBtn.addEventListener('click', hideOverlay);
    }

    // Venue dropdown listener
    const venueSelect = document.getElementById('venueSelect');
    if (venueSelect) {
      venueSelect.addEventListener('change', (e) => {
        const val = e.target.value;
        if (val === 'all') {
          showSchoolArea();
          hideOverlay();
        } else {
          selectVenueById(val);
        }
      });
    }

    const venuesToggle = document.getElementById('venuesToggle');
    if (venuesToggle) {
      venuesToggle.addEventListener('click', () => {
        venuesExpanded = !venuesExpanded;
        venuesToggle.setAttribute('aria-expanded', String(venuesExpanded));
        renderSidebarList();
      });
    }
  }

  function hasCoordinates(venue) {
    return Number.isFinite(venue.lat) && venue.lat >= -90 && venue.lat <= 90
      && Number.isFinite(venue.lng) && venue.lng >= -180 && venue.lng <= 180;
  }

  // Extract unique venues from events list
  function updateVenues(events) {
    const schoolMeta = window.GameDayFirebase?.getSchoolMeta?.();
    if (schoolMeta && Number.isFinite(schoolMeta.lat) && Number.isFinite(schoolMeta.lng)) {
      HOME_COORDS = { lat: schoolMeta.lat, lng: schoolMeta.lng, name: schoolMeta.venueName || 'Home School' };
    }
    const homeEvt = events.find(e => e.locationType === 'Home' && Number.isFinite(e.lat) && Number.isFinite(e.lng));
    if (homeEvt && hasCoordinates(homeEvt)) {
      HOME_COORDS = { lat: homeEvt.lat, lng: homeEvt.lng, name: homeEvt.venueName || 'Home School' };
    }

    initMap();
    if (!mapInstance || !markersLayer) return;

    markersLayer.clearLayers();
    const venueMap = new Map();

    events.forEach(evt => {
      if (!evt.venueName) return;
      const key = evt.venueName.toLowerCase();
      if (!venueMap.has(key)) {
        venueMap.set(key, {
          id: `ven-${String(evt.id || key).replace(/[^a-z0-9-]+/gi, '-')}`,
          name: evt.venueName,
          address: evt.venueAddress || 'Address not listed',
          isHome: evt.locationType === 'Home',
          lat: Number.isFinite(evt.lat) ? evt.lat : (evt.locationType === 'Home' ? HOME_COORDS.lat : null),
          lng: Number.isFinite(evt.lng) ? evt.lng : (evt.locationType === 'Home' ? HOME_COORDS.lng : null),
          parking: evt.parkingInfo || 'Standard spectator parking.',
          games: []
        });
      }
      const venue = venueMap.get(key);
      if (!hasCoordinates(venue) && Number.isFinite(evt.lat) && Number.isFinite(evt.lng)) {
        venue.lat = evt.lat;
        venue.lng = evt.lng;
      }
      venue.games.push(evt);
    });

    currentVenues = Array.from(venueMap.values());
    renderSidebarList();
    renderVenueDropdown();
    renderMarkers();
  }

  // Create custom HTML icon for Leaflet
  function createCustomIcon(isHome) {
    const color = isHome ? '#10b981' : '#f97316';
    const iconClass = isHome ? 'fa-school' : 'fa-location-dot';
    return L.divIcon({
      className: 'custom-leaflet-marker',
      html: `
        <div style="
          background: ${color};
          width: 34px;
          height: 34px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          box-shadow: 0 4px 12px rgba(0,0,0,0.35);
          border: 2px solid #ffffff;
          font-size: 14px;
          cursor: pointer;
        ">
          <i class="fa-solid ${iconClass}"></i>
        </div>
      `,
      iconSize: [34, 34],
      iconAnchor: [17, 17]
    });
  }

  function renderMarkers() {
    if (!mapInstance || !markersLayer) return;

    currentVenues.filter(hasCoordinates).forEach(venue => {
      const marker = L.marker([venue.lat, venue.lng], {
        icon: createCustomIcon(venue.isHome)
      });

      marker.on('click', () => {
        showVenueDetail(venue);
      });

      marker.bindTooltip(`<b>${GameDayUtils.escapeHtml(venue.name)}</b><br>${venue.isHome ? '🏠 Home Venue' : '🚌 Away Venue'}`, {
        direction: 'top',
        offset: [0, -10]
      });

      markersLayer.addLayer(marker);
    });

    showSchoolArea();
  }

  function showSchoolArea() {
    if (!mapInstance) return;
    mapInstance.setView([HOME_COORDS.lat, HOME_COORDS.lng], 10);
  }

  function renderSidebarList() {
    const listEl = document.getElementById('venuesList');
    if (!listEl) return;

    const venuesToggle = document.getElementById('venuesToggle');
    const visibleVenues = venuesExpanded ? currentVenues : currentVenues.slice(0, 6);
    listEl.innerHTML = visibleVenues.map(venue => {
      const distance = hasCoordinates(venue) ? calculateDistance(HOME_COORDS.lat, HOME_COORDS.lng, venue.lat, venue.lng) : null;
      const distLabel = venue.isHome ? 'Campus Home Field'
        : distance === null ? 'Map location unavailable'
          : `${distance.toFixed(1)} miles away`;
      return GameDayRender.venueListItem({
        id: venue.id,
        name: venue.name,
        address: venue.address,
        isHome: venue.isHome,
        distanceLabel: distLabel
      });
    }).join('');
    if (venuesToggle) {
      venuesToggle.hidden = currentVenues.length <= 6;
      venuesToggle.textContent = venuesExpanded ? 'Show fewer venues' : `Show all ${currentVenues.length} venues`;
      venuesToggle.setAttribute('aria-expanded', String(venuesExpanded));
    }

    // Attach click listeners
    listEl.querySelectorAll('.venue-item-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.dataset.venueId;
        selectVenueById(id);
      });
    });
  }

  function renderVenueDropdown() {
    const select = document.getElementById('venueSelect');
    if (!select) return;

    select.innerHTML = '<option value="all">📍 Show All Stadiums & Arenas</option>' +
      currentVenues.map(v => GameDayRender.venueOption({ id: v.id, name: v.name, isHome: v.isHome })).join('');
  }

  function selectVenueById(venueId) {
    const venue = currentVenues.find(v => v.id === venueId);
    if (!venue || !mapInstance) return;

    if (hasCoordinates(venue)) {
      mapInstance.flyTo([venue.lat, venue.lng], 14, { duration: 1.2 });
    }
    showVenueDetail(venue);

    // Highlight active card in sidebar
    document.querySelectorAll('.venue-item-card').forEach(c => {
      c.classList.toggle('active', c.dataset.venueId === venueId);
    });
  }

  function showVenueDetail(venue) {
    const overlay = document.getElementById('mapOverlayCard');
    const content = document.getElementById('mapOverlayContent');
    if (!overlay || !content) return;

    content.innerHTML = GameDayRender.venueDetail(venue);

    overlay.style.display = 'block';
  }

  function hideOverlay() {
    const overlay = document.getElementById('mapOverlayCard');
    if (overlay) overlay.style.display = 'none';
  }

  // Calculate distance in miles using Haversine formula
  function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 3958.8; // Earth radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  function openVenueByName(venueName) {
    if (!venueName) return;
    const found = currentVenues.find(v => v.name.toLowerCase() === venueName.toLowerCase());
    if (found) {
      // Switch to Map tab
      const mapTabBtn = document.getElementById('tabMap');
      if (mapTabBtn) mapTabBtn.click();
      
      // Delay slightly for Leaflet container resize
      setTimeout(() => {
        if (mapInstance) mapInstance.invalidateSize();
        selectVenueById(found.id);
      }, 250);
    }
  }

  function invalidateSize() {
    if (mapInstance) {
      setTimeout(() => mapInstance.invalidateSize(), 200);
    }
  }

  return {
    initMap,
    updateVenues,
    openVenueByName,
    invalidateSize
  };
})();

// Export globally
window.GameDayMap = GameDayMap;
