// Roman Empire Map
// Stylized SVG map of the Mediterranean. Province shapes are rough but
// positioned geographically; conquest proceeds in historical order.
const RomanMap = {
    viewBox: '0 0 1000 620',
    selectedProvinceId: null,

    // Non-Roman lands drawn beneath the provinces for geographic context
    barbarianLands: [
        { name: 'Germania', d: 'M310,58 L960,58 L960,168 L700,178 L622,172 L520,178 L420,158 L340,148 L308,118 Z' },
        { name: 'Sarmatia', d: 'M702,178 L960,168 L960,252 L868,262 L802,256 L712,210 Z' },
        { name: 'Parthia', d: 'M737,300 L866,290 L960,300 L960,430 L852,432 L846,392 L802,366 L742,347 Z' },
        { name: 'Arabia', d: 'M846,442 L960,430 L960,560 L758,560 L751,472 L742,437 L790,447 L822,447 Z' },
        { name: 'Mauretania', d: 'M40,378 L236,396 L268,404 L258,442 L120,450 L40,430 Z' },
        { name: 'Libya Interior', d: 'M268,404 L332,398 L392,384 L474,440 L502,450 L558,452 L582,432 L620,470 L662,462 L690,482 L700,545 L300,545 L258,442 Z' }
    ],

    // Province shapes keyed by province name (matches GameConfig.provinces)
    provincePaths: {
        'Italia': 'M340,208 L400,214 L420,240 L425,270 L450,300 L470,325 L458,342 L432,330 L408,298 L388,278 L365,250 L345,230 Z',
        'Sicilia': 'M428,344 L466,344 L452,372 L424,362 Z',
        'Sardinia et Corsica': 'M345,268 L362,266 L364,290 L347,292 Z M341,298 L361,296 L363,332 L343,334 Z',
        'Hispania Citerior': 'M140,250 L240,255 L250,270 L235,300 L205,345 L175,360 L160,330 L150,290 Z',
        'Hispania Ulterior': 'M60,300 L140,250 L150,290 L160,330 L175,360 L150,380 L100,375 L70,345 Z',
        'Macedonia': 'M556,268 L610,262 L626,284 L616,310 L600,340 L585,356 L568,336 L575,305 L553,290 Z',
        'Africa': 'M240,378 L320,358 L360,350 L396,358 L390,384 L330,398 L268,404 L236,396 Z',
        'Asia': 'M658,300 L720,294 L740,314 L735,344 L700,355 L664,340 L648,320 Z',
        'Gallia Narbonensis': 'M240,250 L285,235 L300,210 L330,224 L342,250 L300,266 L258,262 Z',
        'Cilicia': 'M740,348 L790,344 L802,366 L770,376 L734,368 Z',
        'Creta et Cyrenaica': 'M600,386 L652,382 L657,396 L604,400 Z M478,420 L560,410 L582,432 L558,452 L500,450 L474,440 Z',
        'Bithynia et Pontus': 'M690,268 L800,258 L862,268 L866,290 L800,294 L740,300 L694,294 Z',
        'Syria': 'M790,362 L840,356 L850,392 L846,442 L820,447 L800,412 L785,386 Z',
        'Gallia Comata': 'M200,158 L280,148 L310,175 L300,210 L285,235 L240,250 L205,240 L185,205 Z',
        'Aegyptus': 'M660,440 L742,437 L751,472 L740,540 L700,545 L690,482 L664,460 Z',
        'Britannia': 'M150,60 L200,55 L215,80 L205,105 L215,130 L190,150 L160,145 L145,120 L155,95 L140,80 Z',
        'Dacia': 'M598,180 L680,168 L702,196 L680,215 L622,220 L595,200 Z'
    },

    // Label anchor points [x, y]
    labelPositions: {
        'Italia': [398, 252],
        'Sicilia': [445, 356],
        'Sardinia et Corsica': [352, 314],
        'Hispania Citerior': [200, 292],
        'Hispania Ulterior': [110, 330],
        'Macedonia': [592, 300],
        'Africa': [312, 380],
        'Asia': [695, 324],
        'Gallia Narbonensis': [290, 246],
        'Cilicia': [768, 360],
        'Creta et Cyrenaica': [522, 432],
        'Bithynia et Pontus': [778, 278],
        'Syria': [818, 398],
        'Gallia Comata': [245, 198],
        'Britannia': [180, 102],
        'Aegyptus': [706, 496],
        'Dacia': [645, 196]
    },

    // Short display names for the map surface
    shortNames: {
        'Sardinia et Corsica': 'Sardinia',
        'Hispania Citerior': 'Hisp. Cit.',
        'Hispania Ulterior': 'Hisp. Ult.',
        'Gallia Narbonensis': 'Narbonensis',
        'Creta et Cyrenaica': 'Creta et Cyr.',
        'Bithynia et Pontus': 'Bithynia',
        'Gallia Comata': 'Gallia'
    },

    // Render the map into a container element
    render(containerId, state, onSelect) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const nextTarget = state.provinces.find(p => !p.conquered);

        let svg = `<svg viewBox="${this.viewBox}" preserveAspectRatio="xMidYMid meet" class="empire-map" role="img" aria-label="Map of the Roman Empire">`;

        // Sea
        svg += `<rect x="0" y="0" width="1000" height="620" class="map-sea"/>`;

        // Barbarian lands
        this.barbarianLands.forEach(land => {
            svg += `<path d="${land.d}" class="map-barbarian"/>`;
        });

        // Provinces
        state.provinces.forEach(province => {
            const d = this.provincePaths[province.name];
            if (!d) return;

            let cls = 'map-province ' + (province.conquered ? 'map-conquered' : 'map-unconquered');
            if (nextTarget && province.id === nextTarget.id) cls += ' map-next-target';
            if (province.id === this.selectedProvinceId) cls += ' map-selected';

            svg += `<path d="${d}" class="${cls}" data-province-id="${province.id}"><title>${this.buildTooltip(province, state)}</title></path>`;
        });

        // Labels and ownership dots (drawn above shapes, non-interactive)
        state.provinces.forEach(province => {
            const pos = this.labelPositions[province.name];
            if (!pos) return;
            const label = this.shortNames[province.name] || province.name;
            const cls = province.conquered ? 'map-label map-label-conquered' : 'map-label';
            svg += `<text x="${pos[0]}" y="${pos[1]}" class="${cls}">${label}</text>`;

            if (province.conquered) {
                svg += this.ownershipDots(province, state, pos);
            }
        });

        svg += '</svg>';
        container.innerHTML = svg;

        container.querySelectorAll('.map-province').forEach(el => {
            el.addEventListener('click', () => {
                const id = parseInt(el.dataset.provinceId);
                this.selectedProvinceId = (this.selectedProvinceId === id) ? null : id;
                if (onSelect) onSelect(this.selectedProvinceId);
            });
        });
    },

    // Row of colored dots under the label showing which families hold estates
    ownershipDots(province, state, pos) {
        const counts = {};
        province.estates.forEach(e => {
            if (e.ownerId !== null) counts[e.ownerId] = (counts[e.ownerId] || 0) + 1;
        });
        const owners = Object.keys(counts).map(Number);
        if (owners.length === 0) return '';

        let out = '';
        const spacing = 13;
        const startX = pos[0] - ((owners.length - 1) * spacing) / 2;
        owners.forEach((ownerId, i) => {
            const color = GameConfig.playerColors[ownerId] || '#ccc';
            const x = startX + i * spacing;
            const y = pos[1] + 12;
            out += `<circle cx="${x}" cy="${y}" r="5" fill="${color}" class="map-owner-dot"/>`;
            out += `<text x="${x}" y="${y + 3}" class="map-owner-count">${counts[ownerId]}</text>`;
        });
        return out;
    },

    buildTooltip(province, state) {
        let tip = `${province.name} (${province.yearLabel})`;
        if (province.conquered) {
            const counts = {};
            let unowned = 0;
            province.estates.forEach(e => {
                if (e.ownerId === null) unowned++;
                else {
                    const owner = state.players.find(p => p.id === e.ownerId);
                    counts[owner.name] = (counts[owner.name] || 0) + 1;
                }
            });
            tip += ` — ${province.estates.length} estates`;
            Object.keys(counts).forEach(name => { tip += `\n${name}: ${counts[name]}`; });
            if (unowned > 0) tip += `\nUndistributed: ${unowned}`;
        } else {
            tip += ` — unconquered (${province.estates.length} estates await)`;
        }
        return tip;
    }
};
