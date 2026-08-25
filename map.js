/**
 * GameDay+ - Interactive Stadium & Away Games Map Module
 * Powered by Leaflet & OpenStreetMap with custom pins & 1-click GPS routing
 */

const GameDayMap = (function() {
  let mapInstance = null;
  let markersLayer = null;
  let currentVenues = [];

  // Home School base coordinates (Westfield High)
  const HOME_COORDS = { lat: 40.71278, lng: -74.00594, name: 'Westfield High School' };

  function initMap() {
    if (mapInstance) return;

    const mapElement = document.getElementById('leafletMap');
    if (!mapElement) return;

    // Center near North Jersey / New York metro area default
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
          fitAllMarkers();
          hideOverlay();
        } else {
          selectVenueById(val);
        }
      });
    }
  }

  // Extract unique venues from events list
  function updateVenues(events) {
    initMap();
    if (!mapInstance || !markersLayer) return;

    markersLayer.clearLayers();
    const venueMap = new Map();

    events.forEach(evt => {
      if (!evt.venueName) return;
      const key = evt.venueName.toLowerCase();
      if (!venueMap.has(key)) {
        venueMap.set(key, {
          id: 'ven-' + Math.random().toString(36).substring(2, 7),
          name: evt.venueName,
          address: evt.venueAddress || 'Address not listed',
          isHome: evt.locationType === 'Home',
          lat: evt.lat || HOME_COORDS.lat,
          lng: evt.lng || HOME_COORDS.lng,
          parking: evt.parkingInfo || 'Standard spectator parking.',
          games: []
        });
      }
      venueMap.get(key).games.push(evt);
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

    currentVenues.forEach(venue => {
      const marker = L.marker([venue.lat, venue.lng], {
        icon: createCustomIcon(venue.isHome)
      });

      marker.on('click', () => {
        showVenueDetail(venue);
      });

      marker.bindTooltip(`<b>${venue.name}</b><br>${venue.isHome ? '🏠 Home Venue' : '🚌 Away Venue'}`, {
        direction: 'top',
        offset: [0, -10]
      });

      markersLayer.addLayer(marker);
    });

    fitAllMarkers();
  }

  function fitAllMarkers() {
    if (!markersLayer || currentVenues.length === 0) return;
    const group = L.featureGroup(markersLayer.getLayers());
    mapInstance.fitBounds(group.getBounds().pad(0.15));
  }

  function renderSidebarList() {
    const listEl = document.getElementById('venuesList');
    if (!listEl) return;

    listEl.innerHTML = currentVenues.map(venue => {
      const distance = calculateDistance(HOME_COORDS.lat, HOME_COORDS.lng, venue.lat, venue.lng);
      const distLabel = venue.isHome ? 'Campus Home Field' : `${distance.toFixed(1)} miles away`;
      return `
        <div class="venue-item-card" data-venue-id="${venue.id}">
          <h4>${venue.name}</h4>
          <p><i class="fa-solid fa-location-dot"></i> ${venue.address}</p>
          <span class="venue-tag ${venue.isHome ? 'badge-home' : 'badge-away'}">
            ${venue.isHome ? '🏠 HOME' : '🚌 AWAY'} &bull; ${distLabel}
          </span>
        </div>
      `;
    }).join('');

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
      currentVenues.map(v => `<option value="${v.id}">${v.isHome ? '🏠' : '🚌'} ${v.name}</option>`).join('');
  }

  function selectVenueById(venueId) {
    const venue = currentVenues.find(v => v.id === venueId);
    if (!venue || !mapInstance) return;

    mapInstance.flyTo([venue.lat, venue.lng], 14, { duration: 1.2 });
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

    const encodedAddr = encodeURIComponent(`${venue.name}, ${venue.address}`);
    const gmapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodedAddr}`;
    const appleMapsUrl = `https://maps.apple.com/?daddr=${encodedAddr}`;
    const wazeUrl = `https://waze.com/ul?q=${encodedAddr}&navigate=yes`;

    const upcomingMatch = venue.games[0];
    const matchInfo = upcomingMatch ? `<strong>Next Event:</strong> ${upcomingMatch.sport} vs ${upcomingMatch.opponent} (${upcomingMatch.date} @ ${upcomingMatch.time})` : '';

    content.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom: 0.5rem;">
        <div>
          <h3 style="font-size: 1.25rem; font-weight: 800;">${venue.name}</h3>
          <p style="font-size: 0.85rem; color: var(--text-muted);"><i class="fa-solid fa-location-pin"></i> ${venue.address}</p>
        </div>
        <span class="location-badge ${venue.isHome ? 'badge-home' : 'badge-away'}">
          ${venue.isHome ? 'Home Venue' : 'Away Venue'}
        </span>
      </div>

      <div style="font-size: 0.82rem; margin: 0.5rem 0; color: var(--text-main); background: var(--bg-input); padding: 0.6rem; border-radius: var(--radius-sm);">
        <p><i class="fa-solid fa-square-parking" style="color: var(--primary);"></i> <strong>Parking & Entry:</strong> ${venue.parking}</p>
        ${matchInfo ? `<p style="margin-top: 0.35rem;"><i class="fa-solid fa-trophy" style="color: var(--primary);"></i> ${matchInfo}</p>` : ''}
      </div>

      <div class="directions-links-row">
        <a href="${gmapsUrl}" target="_blank" rel="noopener" class="btn-nav-app">
          <i class="fa-brands fa-google"></i> Google Maps
        </a>
        <a href="${appleMapsUrl}" target="_blank" rel="noopener" class="btn-nav-app">
          <i class="fa-brands fa-apple"></i> Apple Maps
        </a>
        <a href="${wazeUrl}" target="_blank" rel="noopener" class="btn-nav-app">
          <i class="fa-brands fa-waze"></i> Waze Navigation
        </a>
      </div>
    `;

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
