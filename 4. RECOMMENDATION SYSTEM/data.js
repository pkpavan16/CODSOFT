// Curated dataset of movies, books, and products with tags, metadata, and custom CSS gradients for beautiful item cards.
// Also includes pre-configured mock user profiles for Collaborative Filtering.

const ITEMS = [
  // === MOVIES ===
  {
    id: "m1",
    category: "movies",
    title: "Inception",
    year: 2010,
    genres: ["Sci-Fi", "Action", "Thriller"],
    description: "A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.",
    imageGradient: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)",
    ratingCount: 1240,
    ratingAverage: 4.8
  },
  {
    id: "m2",
    category: "movies",
    title: "Interstellar",
    year: 2014,
    genres: ["Sci-Fi", "Drama", "Adventure"],
    description: "A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival in a dying world.",
    imageGradient: "linear-gradient(135deg, #090514 0%, #2e1065 100%)",
    ratingCount: 980,
    ratingAverage: 4.9
  },
  {
    id: "m3",
    category: "movies",
    title: "The Dark Knight",
    year: 2008,
    genres: ["Action", "Crime", "Drama", "Thriller"],
    description: "When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests.",
    imageGradient: "linear-gradient(135deg, #020617 0%, #1e293b 100%)",
    ratingCount: 1540,
    ratingAverage: 4.9
  },
  {
    id: "m4",
    category: "movies",
    title: "La La Land",
    year: 2016,
    genres: ["Romance", "Drama", "Music", "Comedy"],
    description: "While navigating their careers in Los Angeles, a pianist and an actress fall in love while attempting to reconcile their aspirations for the future.",
    imageGradient: "linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)",
    ratingCount: 750,
    ratingAverage: 4.6
  },
  {
    id: "m5",
    category: "movies",
    title: "Spirited Away",
    year: 2001,
    genres: ["Animation", "Adventure", "Fantasy"],
    description: "During her family's move to the suburbs, a sullen 10-year-old girl wanders into a world ruled by gods, witches, and spirits, where humans are changed into beasts.",
    imageGradient: "linear-gradient(135deg, #0d9488 0%, #059669 100%)",
    ratingCount: 880,
    ratingAverage: 4.8
  },
  {
    id: "m6",
    category: "movies",
    title: "Get Out",
    year: 2017,
    genres: ["Horror", "Mystery", "Thriller"],
    description: "A young African-American visits his white girlfriend's parents for the weekend, where his simmering uneasiness about their reception eventually reaches a boiling point.",
    imageGradient: "linear-gradient(135deg, #180828 0%, #3b0764 100%)",
    ratingCount: 620,
    ratingAverage: 4.5
  },
  {
    id: "m7",
    category: "movies",
    title: "The Godfather",
    year: 1972,
    genres: ["Crime", "Drama"],
    description: "The aging patriarch of an organized crime dynasty in postwar New York City transfers control of his clandestine empire to his reluctant youngest son.",
    imageGradient: "linear-gradient(135deg, #1e1b4b 0%, #450a0a 100%)",
    ratingCount: 1100,
    ratingAverage: 4.9
  },
  {
    id: "m8",
    category: "movies",
    title: "Superbad",
    year: 2007,
    genres: ["Comedy"],
    description: "Two co-dependent high school seniors are forced to deal with separation anxiety after their plan to stage a booze-fueled party goes awry.",
    imageGradient: "linear-gradient(135deg, #d97706 0%, #b45309 100%)",
    ratingCount: 530,
    ratingAverage: 4.4
  },
  {
    id: "m9",
    category: "movies",
    title: "Eternal Sunshine of the Spotless Mind",
    year: 2004,
    genres: ["Drama", "Romance", "Sci-Fi"],
    description: "When their relationship turns sour, a young couple undergoes a medical procedure to have each other erased from their memories forever.",
    imageGradient: "linear-gradient(135deg, #4f46e5 0%, #db2777 100%)",
    ratingCount: 690,
    ratingAverage: 4.7
  },
  {
    id: "m10",
    category: "movies",
    title: "Avengers: Endgame",
    year: 2019,
    genres: ["Action", "Sci-Fi", "Adventure"],
    description: "After the devastating events of Infinity War, the universe is in ruins. With the help of remaining allies, the Avengers assemble once more to reverse Thanos' actions.",
    imageGradient: "linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 100%)",
    ratingCount: 1400,
    ratingAverage: 4.7
  },
  {
    id: "m11",
    category: "movies",
    title: "Pulp Fiction",
    year: 1994,
    genres: ["Crime", "Thriller", "Drama"],
    description: "The lives of two mob hitmen, a boxer, a gangster and his wife, and a pair of diner bandits intertwine in four tales of violence and redemption.",
    imageGradient: "linear-gradient(135deg, #78350f 0%, #451a03 100%)",
    ratingCount: 940,
    ratingAverage: 4.8
  },
  {
    id: "m12",
    category: "movies",
    title: "Forrest Gump",
    year: 1994,
    genres: ["Drama", "Romance"],
    description: "The history of the United States from the 1950s to the 1970s unfolds from the perspective of an Alabama man with an IQ of 75, who yearns to be reunited with his childhood sweetheart.",
    imageGradient: "linear-gradient(135deg, #ea580c 0%, #ca8a04 100%)",
    ratingCount: 1120,
    ratingAverage: 4.8
  },
  {
    id: "m13",
    category: "movies",
    title: "The Matrix",
    year: 1999,
    genres: ["Sci-Fi", "Action"],
    description: "When a beautiful stranger leads computer hacker Neo to a forbidding underworld, he discovers the shocking truth--the life he knows is the elaborate deception of an evil cyber-intelligence.",
    imageGradient: "linear-gradient(135deg, #065f46 0%, #022c22 100%)",
    ratingCount: 1320,
    ratingAverage: 4.9
  },
  {
    id: "m14",
    category: "movies",
    title: "Titanic",
    year: 1997,
    genres: ["Drama", "Romance"],
    description: "A seventeen-year-old aristocrat falls in love with a kind but poor artist aboard the luxurious, ill-fated R.M.S. Titanic.",
    imageGradient: "linear-gradient(135deg, #0369a1 0%, #ec4899 100%)",
    ratingCount: 990,
    ratingAverage: 4.6
  },
  {
    id: "m15",
    category: "movies",
    title: "Parasite",
    year: 2019,
    genres: ["Drama", "Thriller", "Comedy"],
    description: "Greed and class discrimination threaten the newly formed symbiotic relationship between the wealthy Park family and the destitute Kim clan.",
    imageGradient: "linear-gradient(135deg, #374151 0%, #111827 100%)",
    ratingCount: 820,
    ratingAverage: 4.8
  },

  // === BOOKS ===
  {
    id: "b1",
    category: "books",
    title: "To Kill a Mockingbird",
    author: "Harper Lee",
    genres: ["Classic", "Drama", "Historical"],
    description: "The explosion of racial tension in a southern town as a black man is accused of raping a white girl, seen through the eyes of a young girl named Scout.",
    imageGradient: "linear-gradient(135deg, #d97706 0%, #7c2d12 100%)",
    ratingCount: 840,
    ratingAverage: 4.9
  },
  {
    id: "b2",
    category: "books",
    title: "1984",
    author: "George Orwell",
    genres: ["Dystopian", "Sci-Fi", "Political"],
    description: "In a terrifyingly totalitarian future, Winston Smith begins a rebellion by falling in love and keeping a secret diary, directly challenging the all-seeing Big Brother.",
    imageGradient: "linear-gradient(135deg, #1e293b 0%, #475569 100%)",
    ratingCount: 930,
    ratingAverage: 4.8
  },
  {
    id: "b3",
    category: "books",
    title: "The Great Gatsby",
    author: "F. Scott Fitzgerald",
    genres: ["Classic", "Romance", "Drama"],
    description: "A portrait of the Jazz Age in all its decadence and excess, telling the tragic story of Jay Gatsby and his obsessive love for Daisy Buchanan.",
    imageGradient: "linear-gradient(135deg, #ca8a04 0%, #1e1b4b 100%)",
    ratingCount: 710,
    ratingAverage: 4.5
  },
  {
    id: "b4",
    category: "books",
    title: "The Hobbit",
    author: "J.R.R. Tolkien",
    genres: ["Fantasy", "Adventure"],
    description: "Bilbo Baggins, a home-loving hobbit, is whisked away on an epic quest by the wizard Gandalf and a band of dwarves to reclaim their treasure from a dragon.",
    imageGradient: "linear-gradient(135deg, #047857 0%, #064e3b 100%)",
    ratingCount: 890,
    ratingAverage: 4.9
  },
  {
    id: "b5",
    category: "books",
    title: "Pride and Prejudice",
    author: "Jane Austen",
    genres: ["Classic", "Romance", "Comedy"],
    description: "The turbulent relationship between Elizabeth Bennet, the daughter of a country gentleman, and Fitzwilliam Darcy, a rich aristocratic landowner.",
    imageGradient: "linear-gradient(135deg, #db2777 0%, #9d174d 100%)",
    ratingCount: 650,
    ratingAverage: 4.7
  },
  {
    id: "b6",
    category: "books",
    title: "Dune",
    author: "Frank Herbert",
    genres: ["Sci-Fi", "Fantasy", "Adventure"],
    description: "Set on the desert planet Arrakis, Dune is the story of the boy Paul Atreides, who would become the mysterious man known as Muad'Dib to avenge the traitorous plot against his family.",
    imageGradient: "linear-gradient(135deg, #b45309 0%, #78350f 100%)",
    ratingCount: 790,
    ratingAverage: 4.8
  },
  {
    id: "b7",
    category: "books",
    title: "Neuromancer",
    author: "William Gibson",
    genres: ["Sci-Fi", "Cyberpunk", "Thriller"],
    description: "Case, a washed-up computer hacker, is hired by a mysterious employer for a final, seemingly impossible hack against a powerful artificial intelligence.",
    imageGradient: "linear-gradient(135deg, #0ea5e9 0%, #1e1b4b 100%)",
    ratingCount: 460,
    ratingAverage: 4.4
  },
  {
    id: "b8",
    category: "books",
    title: "Sapiens",
    author: "Yuval Noah Harari",
    genres: ["History", "Science", "Non-fiction"],
    description: "A narrative sweep of the history of humankind, exploring how biology and history have defined us and enhanced our understanding of what it means to be human.",
    imageGradient: "linear-gradient(135deg, #84cc16 0%, #3f6212 100%)",
    ratingCount: 810,
    ratingAverage: 4.7
  },
  {
    id: "b9",
    category: "books",
    title: "Atomic Habits",
    author: "James Clear",
    genres: ["Self-Help", "Psychology", "Non-fiction"],
    description: "An easy and proven way to build good habits and break bad ones, drawing on ideas from biology, psychology, and neuroscience.",
    imageGradient: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
    ratingCount: 950,
    ratingAverage: 4.9
  },
  {
    id: "b10",
    category: "books",
    title: "The Silent Patient",
    author: "Alex Michaelides",
    genres: ["Thriller", "Mystery", "Drama"],
    description: "A shocking psychological thriller about a woman's act of violence against her husband, and the therapist obsessed with uncovering her motive.",
    imageGradient: "linear-gradient(135deg, #4b5563 0%, #111827 100%)",
    ratingCount: 520,
    ratingAverage: 4.5
  },
  {
    id: "b11",
    category: "books",
    title: "Harry Potter and the Sorcerer's Stone",
    author: "J.K. Rowling",
    genres: ["Fantasy", "Adventure", "Young Adult"],
    description: "An orphaned boy enrolls in a school of wizardry, where he learns the truth about himself, his family and the terrible evil that haunts the magical world.",
    imageGradient: "linear-gradient(135deg, #6366f1 0%, #312e81 100%)",
    ratingCount: 1200,
    ratingAverage: 4.9
  },
  {
    id: "b12",
    category: "books",
    title: "The Alchemist",
    author: "Paulo Coelho",
    genres: ["Adventure", "Fantasy", "Philosophy"],
    description: "A young Andalusian shepherd travels to Egypt in search of a treasure buried near the Pyramids, discovering much deeper spiritual wealth along the way.",
    imageGradient: "linear-gradient(135deg, #eab308 0%, #ca8a04 100%)",
    ratingCount: 910,
    ratingAverage: 4.6
  },
  {
    id: "b13",
    category: "books",
    title: "Thinking, Fast and Slow",
    author: "Daniel Kahneman",
    genres: ["Psychology", "Science", "Non-fiction"],
    description: "A detailed breakdown of the two systems that drive the way we think--System 1, which is fast, intuitive, and emotional; and System 2, which is slower and more logical.",
    imageGradient: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
    ratingCount: 640,
    ratingAverage: 4.6
  },
  {
    id: "b14",
    category: "books",
    title: "The Catcher in the Rye",
    author: "J.D. Salinger",
    genres: ["Classic", "Drama"],
    description: "A young man named Holden Caulfield wanders around New York City after being expelled from his prep school, dealing with isolation and teenage angst.",
    imageGradient: "linear-gradient(135deg, #ef4444 0%, #7f1d1d 100%)",
    ratingCount: 610,
    ratingAverage: 4.3
  },
  {
    id: "b15",
    category: "books",
    title: "Educated",
    author: "Tara Westover",
    genres: ["Biography", "Drama", "Non-fiction"],
    description: "A memoir about a young girl who leaves her survivalist family in rural Idaho to pursue education, eventually earning a PhD from Cambridge University.",
    imageGradient: "linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)",
    ratingCount: 580,
    ratingAverage: 4.7
  },

  // === PRODUCTS ===
  {
    id: "p1",
    category: "products",
    title: "Wireless ANC Headphones",
    brand: "Sony",
    genres: ["Tech", "Audio", "Travel"],
    description: "Industry-leading noise-canceling headphones with dual noise sensor technology, premium sound quality, and 30-hour battery life.",
    imageGradient: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
    ratingCount: 420,
    ratingAverage: 4.8
  },
  {
    id: "p2",
    category: "products",
    title: "Smart Fitness Watch",
    brand: "Fitbit",
    genres: ["Tech", "Fitness", "Health"],
    description: "Track your heart rate, sleep quality, daily steps, and workouts with this sleek watch featuring built-in GPS and a vibrant AMOLED screen.",
    imageGradient: "linear-gradient(135deg, #0d9488 0%, #115e59 100%)",
    ratingCount: 310,
    ratingAverage: 4.5
  },
  {
    id: "p3",
    category: "products",
    title: "Ergonomic Office Chair",
    brand: "Herman Miller",
    genres: ["Home", "Office", "Furniture"],
    description: "A state-of-the-art office chair featuring lumbar support, fully adjustable armrests, and breathable mesh designed to optimize productivity and health.",
    imageGradient: "linear-gradient(135deg, #4b5563 0%, #1f2937 100%)",
    ratingCount: 150,
    ratingAverage: 4.9
  },
  {
    id: "p4",
    category: "products",
    title: "Mechanical Gaming Keyboard",
    brand: "Keychron",
    genres: ["Tech", "Gaming", "Accessories"],
    description: "Hot-swappable mechanical keyboard with RGB backlighting, custom switches, and wireless support for both Mac and Windows systems.",
    imageGradient: "linear-gradient(135deg, #8b5cf6 0%, #4c1d95 100%)",
    ratingCount: 280,
    ratingAverage: 4.7
  },
  {
    id: "p5",
    category: "products",
    title: "Portable Espresso Maker",
    brand: "Wacaco",
    genres: ["Kitchen", "Travel", "Coffee"],
    description: "Compact and lightweight hand-powered espresso machine, perfect for making rich, barista-quality espresso shots on hikes or travels.",
    imageGradient: "linear-gradient(135deg, #78350f 0%, #451a03 100%)",
    ratingCount: 190,
    ratingAverage: 4.6
  },
  {
    id: "p6",
    category: "products",
    title: "Hydro Flask Water Bottle",
    brand: "Hydro Flask",
    genres: ["Fitness", "Outdoor", "Accessories"],
    description: "Double-wall vacuum-insulated stainless steel water bottle that keeps cold drinks icy cold for 24 hours and hot drinks warm for 12 hours.",
    imageGradient: "linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%)",
    ratingCount: 540,
    ratingAverage: 4.8
  },
  {
    id: "p7",
    category: "products",
    title: "Kindle Paperwhite",
    brand: "Amazon",
    genres: ["Tech", "Reading", "Travel"],
    description: "Waterproof e-reader with a 6.8-inch display, adjustable warm light, and weeks of battery life. Store thousands of books in a pocket-sized device.",
    imageGradient: "linear-gradient(135deg, #374151 0%, #111827 100%)",
    ratingCount: 610,
    ratingAverage: 4.8
  },
  {
    id: "p8",
    category: "products",
    title: "Instant Pot Multi-Cooker",
    brand: "Instant Pot",
    genres: ["Kitchen", "Appliances"],
    description: "7-in-1 electric pressure cooker, slow cooker, rice cooker, steamer, sauté pan, yogurt maker, and warmer for fast, healthy family meals.",
    imageGradient: "linear-gradient(135deg, #f43f5e 0%, #be123c 100%)",
    ratingCount: 480,
    ratingAverage: 4.7
  },
  {
    id: "p9",
    category: "products",
    title: "Ultra-Wide Curved Monitor",
    brand: "Dell",
    genres: ["Tech", "Productivity", "Office", "Gaming"],
    description: "34-inch curved monitor with WQHD resolution, built-in speakers, USB-C hub connectivity, and immersive panoramic viewing.",
    imageGradient: "linear-gradient(135deg, #1e3a8a 0%, #1e1b4b 100%)",
    ratingCount: 220,
    ratingAverage: 4.7
  },
  {
    id: "p10",
    category: "products",
    title: "Bluetooth Shower Speaker",
    brand: "JBL",
    genres: ["Audio", "Smart Home", "Outdoor"],
    description: "Ultra-portable, waterproof Bluetooth speaker with a built-in carabiner clip and high-quality sound for up to 10 hours of playback.",
    imageGradient: "linear-gradient(135deg, #f97316 0%, #c2410c 100%)",
    ratingCount: 390,
    ratingAverage: 4.4
  },
  {
    id: "p11",
    category: "products",
    title: "Leather Travel Duffle Bag",
    brand: "Seymour",
    genres: ["Travel", "Fashion"],
    description: "Handcrafted full-grain leather overnight bag with spacious interior compartment, shoe pocket, and adjustable shoulder strap.",
    imageGradient: "linear-gradient(135deg, #7c2d12 0%, #431407 100%)",
    ratingCount: 110,
    ratingAverage: 4.7
  },
  {
    id: "p12",
    category: "products",
    title: "Adjustable Dumbbells Set",
    brand: "Bowflex",
    genres: ["Fitness", "Home Gym"],
    description: "Selectable weight dumbbells that adjust from 5 to 52.5 lbs with a simple turn of a dial, replacing 15 separate pairs of weights.",
    imageGradient: "linear-gradient(135deg, #ef4444 0%, #111827 100%)",
    ratingCount: 260,
    ratingAverage: 4.8
  },
  {
    id: "p13",
    category: "products",
    title: "Smart LED Light Bulbs",
    brand: "Philips Hue",
    genres: ["Smart Home", "Tech"],
    description: "Voice-controlled multicolor LED smart bulbs that allow you to set custom light scenes, timers, and sync with music or movies.",
    imageGradient: "linear-gradient(135deg, #a855f7 0%, #4c1d95 100%)",
    ratingCount: 340,
    ratingAverage: 4.6
  },
  {
    id: "p14",
    category: "products",
    title: "Standing Desk Converter",
    brand: "VariDesk",
    genres: ["Office", "Health", "Productivity"],
    description: "Dual-monitor height-adjustable standing desk riser that sits on top of your current desk, enabling quick transitions between sitting and standing.",
    imageGradient: "linear-gradient(135deg, #64748b 0%, #334155 100%)",
    ratingCount: 140,
    ratingAverage: 4.5
  },
  {
    id: "p15",
    category: "products",
    title: "High-Speed Blender",
    brand: "Vitamix",
    genres: ["Kitchen", "Health"],
    description: "Professional-grade blender with ten variable speeds, pulse control, and a self-cleaning container for perfect smoothies, soups, and purees.",
    imageGradient: "linear-gradient(135deg, #10b981 0%, #064e3b 100%)",
    ratingCount: 230,
    ratingAverage: 4.9
  }
];

// Pre-defined user profiles representing distinct taste patterns.
// Used for Collaborative Filtering calculation demonstrations.
const MOCK_USERS = [
  {
    id: "user_action",
    name: "Alex (Action & Sci-Fi)",
    avatar: "🚀",
    ratings: {
      "m1": 5, // Inception (Sci-Fi, Action, Thriller)
      "m2": 5, // Interstellar (Sci-Fi, Drama)
      "m3": 5, // The Dark Knight (Action, Crime, Drama)
      "m10": 5, // Avengers: Endgame (Action, Sci-Fi)
      "m13": 5, // The Matrix (Sci-Fi, Action)
      "m4": 1, // La La Land (Romance, Drama) - Dislikes
      "m14": 2, // Titanic (Drama, Romance) - Dislikes
      "m8": 3, // Superbad (Comedy)
      // Books
      "b2": 4, // 1984 (Sci-Fi)
      "b6": 5, // Dune (Sci-Fi)
      "b7": 4, // Neuromancer (Sci-Fi)
      "b5": 1, // Pride & Prejudice (Romance)
      // Products
      "p1": 5, // Wireless Headphones
      "p4": 5, // Mechanical Gaming Keyboard
      "p9": 4, // Curved Monitor
      "p12": 4, // Adjustable Dumbbells
      "p13": 3  // Smart Bulbs
    }
  },
  {
    id: "user_drama",
    name: "Sarah (Classic Drama & Romance)",
    avatar: "🎭",
    ratings: {
      "m4": 5, // La La Land (Romance, Drama)
      "m12": 5, // Forrest Gump (Drama, Romance)
      "m14": 5, // Titanic (Drama, Romance)
      "m7": 4, // The Godfather (Drama, Crime)
      "m9": 4, // Eternal Sunshine (Drama, Romance)
      "m1": 2, // Inception (Sci-Fi, Action) - Dislikes
      "m10": 1, // Avengers: Endgame (Action, Sci-Fi) - Dislikes
      "m3": 2, // The Dark Knight (Action, Crime)
      // Books
      "b1": 5, // To Kill a Mockingbird (Classic)
      "b3": 5, // The Great Gatsby (Classic, Romance)
      "b5": 5, // Pride and Prejudice (Classic, Romance)
      "b6": 1, // Dune (Sci-Fi) - Dislikes
      // Products
      "p3": 5, // Ergonomic Office Chair
      "p7": 4, // Kindle Paperwhite
      "p11": 5, // Leather Duffle Bag
      "p4": 1, // Gaming Keyboard - Dislikes
      "p12": 1  // Dumbbells - Dislikes
    }
  },
  {
    id: "user_intellectual",
    name: "Dr. Dave (Non-Fiction & Science)",
    avatar: "🧠",
    ratings: {
      "m2": 4, // Interstellar (Sci-Fi, Drama)
      "m7": 4, // The Godfather (Crime, Drama)
      "m15": 5, // Parasite (Drama, Thriller)
      "m9": 4, // Eternal Sunshine (Drama)
      "m8": 1, // Superbad (Comedy) - Dislikes
      "m10": 1, // Avengers (Action) - Dislikes
      // Books
      "b8": 5, // Sapiens (History/Science)
      "b9": 4, // Atomic Habits (Self-help)
      "b13": 5, // Thinking, Fast and Slow (Psychology)
      "b15": 4, // Educated (Biography)
      "b11": 2, // Harry Potter (Fantasy/YA) - Dislikes
      "b4": 2, // The Hobbit (Fantasy) - Dislikes
      // Products
      "p7": 5, // Kindle Paperwhite
      "p14": 4, // Standing Desk Converter
      "p3": 4, // Ergonomic Office Chair
      "p5": 3, // Portable Espresso Maker
      "p13": 3  // Smart Bulbs
    }
  },
  {
    id: "user_lifestyle",
    name: "Emma (Fitness, Healthy & Kitchen)",
    avatar: "🥗",
    ratings: {
      "m4": 4, // La La Land (Romance, Drama)
      "m5": 5, // Spirited Away (Animation, Fantasy)
      "m12": 4, // Forrest Gump (Drama)
      "m6": 1, // Get Out (Horror) - Dislikes
      // Books
      "b9": 5, // Atomic Habits (Self-help)
      "b12": 4, // The Alchemist (Philosophy/Adventure)
      "b8": 3, // Sapiens (Science)
      // Products
      "p2": 5, // Smart Fitness Watch
      "p6": 5, // Hydro Flask
      "p8": 4, // Instant Pot
      "p12": 5, // Adjustable Dumbbells
      "p15": 5, // High-Speed Blender
      "p1": 3, // Headphones
      "p4": 2  // Gaming Keyboard
    }
  },
  {
    id: "user_casual",
    name: "John (Pop Culture & Thrillers)",
    avatar: "🍿",
    ratings: {
      "m1": 4, // Inception
      "m3": 5, // The Dark Knight
      "m6": 4, // Get Out (Thriller/Horror)
      "m8": 5, // Superbad (Comedy)
      "m10": 5, // Avengers: Endgame
      "m15": 4, // Parasite
      "m7": 2, // The Godfather - Finds it too slow
      // Books
      "b11": 5, // Harry Potter
      "b4": 4, // The Hobbit
      "b10": 5, // The Silent Patient (Thriller)
      "b2": 3, // 1984
      // Products
      "p1": 4, // Headphones
      "p2": 4, // Fitness Watch
      "p10": 5, // Shower Speaker
      "p4": 4, // Mechanical Keyboard
      "p3": 2  // Office Chair - Finds it boring
    }
  }
];

// Initial user profile for the Active User (the person interacting with the website).
// Starts with some default ratings that they can change.
const INITIAL_ACTIVE_USER = {
  id: "active_user",
  name: "You (Active User)",
  avatar: "✨",
  ratings: {
    "m1": 5,  // Loved Inception
    "m2": 4,  // Liked Interstellar
    "m14": 1, // Hated Titanic
    "b2": 5,  // Loved 1984
    "p1": 4   // Liked Wireless Headphones
  }
};
