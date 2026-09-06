tailwind.config = {

    theme: {

        extend: {

            colors: {

                primary: {

                    DEFAULT: "#4f46e5",

                    light: "#6366f1",

                },

                secondary: "#ec4899",

                "background-light": "#f8fafc",

            },

            fontFamily: {

                display: ["Quicksand", "sans-serif"],

            },

            borderRadius: {

                DEFAULT: "0.5rem",

                xl: '1rem',

            },

        },

    },

};





const initialItems = [

    { name: "Red Water Bottle", category: "Water Bottles", type: "Lost", date: "2025-11-28", location: "Gym", contact: "contact@example.com", description: "Stainless steel, small scratch on the side.", img: "https://via.placeholder.com/150/ef4444/ffffff?text=Bottle" },

    { name: "iPhone 13 (Found)", category: "Electronics", type: "Found", date: "2025-11-29", location: "Library Desk", contact: "admin@example.com", description: "Black case, cracked screen protector.", img: "https://via.placeholder.com/150/4f46e5/ffffff?text=Phone" },

    { name: "Black Leather Wallet", category: "Wallet", type: "Lost", date: "2025-11-30", location: "Cafeteria", contact: "user@example.com", description: "Contains student ID, no cash.", img: "https://via.placeholder.com/150/1f2937/ffffff?text=Wallet" }

];



function loadDynamicItems() {

    const storedItems = localStorage.getItem('submittedReports');

    try {

        return storedItems ? JSON.parse(storedItems) : [];

    } catch (e) {

        console.error("Error parsing stored reports:", e);

        return [];

    }

}



const dynamicItems = loadDynamicItems();



const allItems = [...initialItems, ...dynamicItems];



function searchItems() {

    const text = document.getElementById("searchInput").value.toLowerCase();

    const category = document.getElementById("categoryInput").value;

    const grid = document.getElementById("resultsGrid");



    const results = allItems.filter(item =>

        (item.name.toLowerCase().includes(text) || item.description.toLowerCase().includes(text)) &&

        (category === "" || item.category === category)

    );



    grid.innerHTML = results.length

        ? results.map(item => {

            const typeColor = item.type === 'Lost' ? 'text-red-600' : 'text-green-600';

            const typeBg = item.type === 'Lost' ? 'bg-red-100' : 'bg-green-100';

            const imageSrc = item.img || "https://via.placeholder.com/150/aaaaaa/ffffff?text=No+Image";



            return `

<div class="card">

<img src="${imageSrc}" alt="${item.name}">

<div class="p-2">

<div class="flex justify-between items-start mb-1">

<h3 class="text-lg font-bold">${item.name}</h3>

<span class="text-xs font-semibold px-2 py-0.5 rounded-full ${typeBg} ${typeColor}">${item.type}</span>

</div>

<p class="text-xs text-gray-500 mb-2">${item.category} | Lost/Found: ${item.date}</p>

<p class="text-sm text-gray-700 truncate">${item.description}</p>

</div>

</div>`;

        }).join("")

        : "<p class='text-center text-xl text-gray-500 col-span-full mt-10'>No items found matching your search criteria.</p>";

}



window.onload = searchItems;