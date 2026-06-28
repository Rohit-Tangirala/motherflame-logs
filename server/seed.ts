import bcrypt from 'bcryptjs';
import { dbService, initDb } from './db.js';

const categoryContent: Record<string, string> = {
  Technology: `
    <p>The landscape of software development is constantly shifting. Frameworks rise and fall in popularity, leaving developers in a constant state of learning. However, the fundamental principles of computer science remain the same. Understanding data structures, algorithms, and system architecture is far more valuable than memorizing the syntax of the latest JavaScript framework. When you build a solid foundation, learning new tools becomes a trivial matter of adapting to new syntax rather than learning entirely new paradigms.</p>
    <p>One of the biggest challenges in modern technology is managing complexity. As systems grow larger, they become inherently more difficult to understand, maintain, and scale. This is where architectural patterns like microservices, event-driven architecture, and domain-driven design come into play. By breaking down monolithic applications into smaller, independent services, teams can work more autonomously and deploy changes with less risk. However, this distributed nature introduces new challenges, such as network latency, data consistency, and distributed tracing.</p>
    <p>The future of technology is inevitably intertwined with artificial intelligence. We are moving from an era of explicit programming to an era of probabilistic computing. Machine learning models are becoming increasingly adept at tasks that were previously thought to be exclusive to human intelligence, such as natural language processing, image recognition, and even creative writing. As these models become more accessible, they will fundamentally change how we interact with technology and how we build software applications. The role of the developer will shift from writing every line of code to orchestrating AI models and defining higher-level business logic.</p>
    <p>Security is another critical aspect of modern technology that often gets overlooked until it's too late. With the increasing frequency and sophistication of cyberattacks, building secure systems is no longer an optional feature; it's a mandatory requirement. Developers must understand common vulnerabilities like cross-site scripting, SQL injection, and insecure direct object references, and how to mitigate them. Implementing robust authentication and authorization mechanisms, encrypting sensitive data, and regularly updating dependencies are essential practices for any software project. The cost of a security breach can be devastating, both financially and reputationally.</p>
    <p>Finally, the impact of technology on society cannot be ignored. We have a responsibility to build software that is accessible, inclusive, and ethical. We must consider the potential biases in our algorithms, the privacy implications of our data collection practices, and the environmental footprint of our infrastructure. As creators of technology, we hold a significant amount of power, and it is our duty to use that power responsibly. The choices we make today will shape the digital landscape for generations to come, and we must strive to build a future that benefits everyone.</p>
  `,
  Fitness: `
    <p>The human body is an incredibly adaptable machine. When subjected to physical stress, it responds by getting stronger, faster, and more resilient. This principle of progressive overload is the foundation of any effective training program. However, many people fall into the trap of constantly switching routines in search of the "perfect" workout, failing to realize that consistency and gradual progression are far more important than the specific exercises chosen. Mastering the basics and sticking to a plan over the long term is the true key to success.</p>
    <p>Nutrition is often said to be eighty percent of the equation when it comes to fitness, and for good reason. You cannot out-train a bad diet. Building muscle requires a caloric surplus and sufficient protein intake, while losing fat requires a caloric deficit. Understanding macronutrients and how they fuel your body is essential for optimizing performance and body composition. Furthermore, micronutrients play a crucial role in recovery, immune function, and overall health. A balanced diet focused on whole, unprocessed foods is the most sustainable approach.</p>
    <p>Recovery is just as important as the training itself. It is during periods of rest that the body repairs damaged muscle tissue and adapts to the stress of exercise. Adequate sleep is paramount for optimal recovery, as this is when the body releases growth hormone and testosterone. Managing stress levels, staying hydrated, and incorporating active recovery techniques like mobility work and light cardio can also significantly enhance the recovery process. Ignoring recovery will inevitably lead to overtraining, plateaus, and potential injuries.</p>
    <p>Mindset plays a massive role in achieving fitness goals. The journey to a stronger, healthier body is a marathon, not a sprint. It requires discipline, patience, and the ability to push through discomfort. Setting realistic expectations and focusing on the process rather than just the outcome can help maintain motivation over the long haul. Learning to embrace the grind and find joy in the effort itself is a crucial shift in perspective that separates those who succeed from those who quit.</p>
    <p>Finally, it's important to remember that fitness is a highly individual journey. What works for one person may not work for another. Factors such as genetics, lifestyle, and personal preferences all play a role in determining the most effective approach. Experimentation and self-awareness are key to finding a routine that is both enjoyable and sustainable. The ultimate goal should be to build a healthy relationship with exercise and nutrition that enhances your quality of life for years to come.</p>
  `,
  Anime: `
    <p>Anime is a medium that constantly pushes the boundaries of storytelling and visual art. Unlike live-action television, animation allows for a level of creative freedom that is virtually limitless. Creators can bring fantastical worlds, exaggerated emotions, and physics-defying action sequences to life with stunning detail. This ability to transcend reality is what makes anime such a compelling and unique form of entertainment, capable of exploring complex themes in ways that would be impossible in other mediums.</p>
    <p>One of the defining characteristics of many popular anime series is their focus on character development and emotional depth. Protagonists are often deeply flawed individuals who must overcome significant internal and external obstacles to achieve their goals. This journey of self-discovery and growth resonates strongly with audiences, forging a deep emotional connection between the viewer and the characters. The intense focus on interpersonal relationships, themes of friendship, and the struggle against adversity are common tropes that are executed with genuine sincerity.</p>
    <p>The visual style of anime is also highly distinctive and influential. From the highly detailed backgrounds of Makoto Shinkai films to the stylized character designs of Studio Trigger, anime encompasses a wide range of artistic expressions. The use of dynamic camera angles, exaggerated facial expressions, and vibrant color palettes contribute to the overall emotional impact of the storytelling. Animation studios constantly innovate and experiment with new techniques, resulting in visually stunning works of art that are a feast for the eyes.</p>
    <p>Furthermore, anime has a unique ability to tackle complex philosophical and societal issues. Many series explore themes such as the nature of humanity, the ethics of technology, and the consequences of war. By presenting these issues in a fictional context, anime allows viewers to engage with them from a new perspective, fostering critical thinking and reflection. The medium's willingness to delve into mature and thought-provoking subjects has contributed to its growing popularity among adult audiences worldwide.</p>
    <p>The global impact of anime cannot be overstated. It has transcended its origins in Japan to become a cultural phenomenon with a massive international fanbase. The medium has influenced Western animation, film, and even fashion, demonstrating its widespread appeal and cultural significance. As streaming platforms make anime more accessible than ever before, its influence and popularity will continue to grow, solidifying its place as one of the most important and vibrant forms of entertainment in the modern era.</p>
  `,
  Chess: `
    <p>Chess is a game of infinite complexity and profound beauty. It is a battle of minds, where two players attempt to outmaneuver and outthink each other on a board of sixty-four squares. The rules are relatively simple, yet the strategic possibilities are vast and seemingly inexhaustible. Every move is a choice that carries weight and consequences, demanding foresight, calculation, and positional understanding. The game teaches invaluable lessons about planning, patience, and the importance of anticipating your opponent's intentions.</p>
    <p>One of the most fascinating aspects of chess is the interplay between tactics and strategy. Tactics are short-term sequences of moves that force a specific advantage, such as winning material or delivering checkmate. Strategy, on the other hand, involves long-term planning and positional maneuvering aimed at improving the coordination of your pieces and creating weaknesses in the opponent's camp. A strong player must possess both a sharp tactical eye and a deep understanding of strategic principles, seamlessly blending the two to achieve victory.</p>
    <p>The opening phase of a chess game is crucial, as it sets the stage for the middlegame battle. Players must strive to control the center, develop their pieces to active squares, and ensure the safety of their king. There are countless opening variations, each with its own unique characteristics and strategic ideas. Studying opening theory can provide a solid foundation, but it is equally important to understand the underlying principles and plans associated with the chosen opening, rather than simply memorizing moves.</p>
    <p>The middlegame is where the true complexity of chess unfolds. This is the phase where the armies clash, and the strategic plans formulated in the opening are put to the test. Players must carefully evaluate the position, identifying strengths and weaknesses, and formulating a plan of action. This requires a deep understanding of pawn structures, piece coordination, and the delicate balance between attack and defense. The middlegame is a test of creativity, calculation, and positional judgment.</p>
    <p>The endgame is the final phase of a chess game, where the material is reduced, and the remaining pieces take on increased importance. Endgames require a high degree of precision and technical skill, as even a minor mistake can prove fatal. Understanding fundamental endgame principles, such as king activity, pawn majorities, and piece coordination, is essential for converting an advantage into a win or salvaging a draw from a difficult position. Many players neglect endgame study, but it is often the deciding factor in closely contested games.</p>
  `,
  Philosophy: `
    <p>Philosophy is the pursuit of fundamental truths about existence, knowledge, values, reason, mind, and language. It is a disciplined process of inquiry that seeks to understand the world and our place within it. Rather than providing definitive answers, philosophy often focuses on asking the right questions and critically examining our assumptions. By challenging conventional wisdom and engaging in rigorous logical analysis, philosophy helps us develop a deeper and more nuanced understanding of complex issues.</p>
    <p>One of the central branches of philosophy is epistemology, which explores the nature and limits of human knowledge. How do we know what we know? What is the difference between belief and knowledge? Epistemologists grapple with questions about perception, reason, memory, and testimony as sources of justification for our beliefs. Understanding the foundations of knowledge is crucial for navigating an increasingly complex world filled with misinformation and competing truth claims.</p>
    <p>Ethics, another major branch of philosophy, deals with questions of morality and human conduct. What makes an action right or wrong? What is the nature of the good life? Ethical theories, such as utilitarianism, deontology, and virtue ethics, offer different frameworks for evaluating moral dilemmas and guiding our choices. Engaging with ethical philosophy can help us clarify our own values, make more reasoned decisions, and cultivate a sense of moral responsibility.</p>
    <p>Metaphysics is the branch of philosophy that investigates the fundamental nature of reality. It explores questions about existence, time, space, causality, and the relationship between mind and body. Metaphysical inquiry often involves abstract and speculative reasoning, pushing the boundaries of human comprehension. While these questions may seem esoteric, they have profound implications for our understanding of the universe and our place within it.</p>
    <p>The study of philosophy is not merely an academic exercise; it is a practical tool for living a more examined and meaningful life. By cultivating critical thinking skills, logical reasoning, and intellectual humility, philosophy empowers us to navigate complex moral and existential challenges. It encourages us to question our assumptions, engage in constructive dialogue, and strive for a deeper understanding of ourselves and the world around us. In an era characterized by rapid change and uncertainty, the insights of philosophy are more relevant than ever.</p>
  `,
  Japan: `
    <p>Japan is a country of striking contrasts, where ancient traditions seamlessly coexist with cutting-edge technology. From the serene temples of Kyoto to the neon-lit streets of Akihabara, Japan offers a unique and captivating cultural experience. The society is deeply rooted in principles of harmony, respect, and meticulous attention to detail, which are evident in everything from tea ceremonies and flower arranging to the precision of the high-speed Shinkansen trains.</p>
    <p>The Japanese language is a fascinating reflection of the culture, with its complex system of honorifics (keigo) and varied writing systems (hiragana, katakana, and kanji). Learning Japanese provides profound insights into the nuances of social interaction and the underlying values of the society. The language places a strong emphasis on context and unspoken understanding, requiring a level of cultural fluency beyond mere vocabulary and grammar. Mastering Japanese is a challenging but immensely rewarding endeavor.</p>
    <p>Japanese cuisine, or washoku, is renowned worldwide for its emphasis on seasonal ingredients, delicate flavors, and beautiful presentation. From the artistry of sushi and sashimi to the comforting warmth of a bowl of ramen, Japanese food is a testament to the country's dedication to culinary excellence. The concept of umami, a savory fifth taste, is central to many traditional dishes. Dining in Japan is not just about sustenance; it is a multi-sensory experience that reflects a deep appreciation for nature and the changing seasons.</p>
    <p>The concept of "omotenashi," or Japanese hospitality, is a cornerstone of the culture. It goes beyond simple customer service, encompassing a deep sense of care, anticipation of needs, and a genuine desire to ensure the comfort and well-being of guests. This philosophy is evident in all aspects of Japanese society, from the attentive service in restaurants and hotels to the polite and respectful interactions in everyday life. Experiencing omotenashi is a hallmark of any visit to Japan.</p>
    <p>Japan's approach to design and aesthetics is characterized by minimalism, functionality, and a deep appreciation for natural beauty. The concept of "wabi-sabi" celebrates the beauty of imperfection, transience, and the natural cycle of growth and decay. This aesthetic philosophy is reflected in traditional arts such as pottery, architecture, and garden design. The Japanese emphasis on simplicity and harmony continues to influence global design trends, demonstrating the enduring power and universal appeal of Japanese aesthetics.</p>
  `,
  Career: `
    <p>Navigating the modern career landscape requires adaptability, continuous learning, and a strategic approach. The days of working for a single company for an entire career are largely gone. Instead, professionals must embrace a non-linear career path, developing a diverse skillset and remaining open to new opportunities. Building a strong personal brand, cultivating a robust professional network, and proactively seeking out mentorship are essential strategies for long-term success and fulfillment.</p>
    <p>One of the most critical skills in any career is effective communication. Whether you are presenting a proposal, negotiating a salary, or collaborating with a team, the ability to clearly articulate your ideas and actively listen to others is paramount. Strong communication skills foster trust, build relationships, and facilitate collaboration. Investing time in improving your written and verbal communication abilities will yield significant dividends throughout your career.</p>
    <p>Emotional intelligence (EQ) is increasingly recognized as a key differentiator for success in the workplace. The ability to understand and manage your own emotions, as well as navigate the emotions of others, is crucial for effective leadership and teamwork. High EQ individuals are adept at handling stress, resolving conflicts, and building positive relationships. Cultivating emotional intelligence requires self-awareness, empathy, and a willingness to continuously reflect on and improve your interpersonal skills.</p>
    <p>Continuous learning is no longer optional; it is a necessity in a rapidly evolving economy. Professionals must embrace a growth mindset and actively seek out opportunities to expand their knowledge and skills. This can involve formal education, online courses, attending conferences, or simply reading widely in your field. Staying abreast of industry trends and emerging technologies will ensure that you remain competitive and valuable in the job market.</p>
    <p>Finally, finding meaning and purpose in your work is essential for long-term career satisfaction. A fulfilling career aligns with your core values and allows you to make a positive impact. Taking the time to reflect on what truly motivates you and seeking out roles that align with those motivations is crucial. While financial compensation is important, it is rarely the sole driver of true fulfillment. A career built on passion, purpose, and continuous growth is a deeply rewarding journey.</p>
  `,
  "Creative Writing": `
    <p>Creative writing is the art of translating imagination into words. It is a process of exploration, discovery, and expression that allows us to build worlds, create characters, and explore the depths of human emotion. Whether crafting a compelling narrative, composing a moving poem, or writing an engaging essay, creative writing demands vulnerability, observation, and a willingness to experiment with language and form.</p>
    <p>One of the fundamental principles of good storytelling is "show, don't tell." Rather than simply stating that a character is angry, a skilled writer will describe their clenched fists, their flushed face, and the sharp tone of their voice. By providing sensory details and concrete actions, the writer allows the reader to experience the emotion firsthand, creating a more immersive and engaging reading experience. Mastering this technique is essential for bringing characters and scenes to life.</p>
    <p>Developing strong characters is another crucial aspect of creative writing. Characters must be multi-dimensional, with clear motivations, flaws, and desires. They must face challenges and undergo growth or change throughout the narrative. A well-developed character feels real and relatable, drawing the reader into their struggles and triumphs. Understanding human psychology and observing the complexities of human behavior are essential skills for creating compelling characters.</p>
    <p>The revision process is where the true magic of writing often happens. The first draft is rarely perfect; it is simply a starting point. Revision involves refining the prose, strengthening the narrative arc, and ensuring that every word serves a purpose. It requires a critical eye and a willingness to cut or rewrite sections that are not working. Learning to embrace the revision process and view it as an opportunity for improvement is vital for any writer's development.</p>
    <p>Finding your unique voice as a writer takes time, practice, and a willingness to experiment. It involves discovering the themes you are passionate about, the tone that comes naturally to you, and the stylistic choices that define your prose. Reading widely and studying the work of other writers can help you identify what resonates with you and inspire your own creative voice. Ultimately, the most powerful writing comes from a place of authenticity and a genuine desire to connect with the reader.</p>
  `
};

const postsToSeed = [
  { title: "Why Calisthenics is the Most Honest Form of Training", category: "Fitness", tags: ["calisthenics", "bodyweight", "training"] },
  { title: "The Pull-Up Progression That Actually Works", category: "Fitness", tags: ["pullups", "progression", "back"] },
  { title: "The V-Taper Physique — Training for Aesthetics Not Just Strength", category: "Fitness", tags: ["aesthetics", "bodybuilding"] },
  { title: "Jump Rope as Cardio — Underrated or Overhyped", category: "Fitness", tags: ["cardio", "jumprope", "endurance"] },
  { title: "One Piece and the Philosophy of Freedom", category: "Anime", tags: ["onepiece", "freedom", "analysis"] },
  { title: "Aizen Sosuke and the Illusion of Absolute Power", category: "Anime", tags: ["bleach", "villains", "power"] },
  { title: "Bleach's Thousand Year Blood War and What It Got Right", category: "Anime", tags: ["bleach", "tybw", "animation"] },
  { title: "How Chess Teaches You to Think Three Steps Ahead", category: "Chess", tags: ["chess", "strategy", "mindset"] },
  { title: "How to Think Like a Chess Grandmaster in Real Life", category: "Chess", tags: ["grandmaster", "life", "planning"] },
  { title: "The Endgame in Chess — Why Most Players Neglect It", category: "Chess", tags: ["endgame", "improvement", "tactics"] },
  { title: "The Dark Academia Aesthetic and Why It Resonates", category: "Philosophy", tags: ["darkacademia", "aesthetic", "culture"] },
  { title: "Karma Yoga and the Art of Detached Action", category: "Philosophy", tags: ["karmayoga", "spirituality", "action"] },
  { title: "The Wabi-Sabi Philosophy and Imperfect Code", category: "Philosophy", tags: ["wabisabi", "imperfection", "coding"] },
  { title: "The Stoic Developer — Staying Calm When Production Breaks", category: "Philosophy", tags: ["stoicism", "developer", "mindset"] },
  { title: "Building Your First REST API with Express.js", category: "Technology", tags: ["express", "api", "nodejs"] },
  { title: "React vs vanilla JS — when does the complexity pay off", category: "Technology", tags: ["react", "vanillajs", "frontend"] },
  { title: "MySQL vs PostgreSQL — Which Should You Learn First", category: "Technology", tags: ["database", "mysql", "postgresql"] },
  { title: "How Multi-Agent AI Systems Actually Work", category: "Technology", tags: ["ai", "agents", "architecture"] },
  { title: "What JLPT N5 Actually Teaches You About Japanese", category: "Japan", tags: ["jlpt", "japanese", "language"] },
  { title: "Why I Started Learning Japanese at 18", category: "Japan", tags: ["language", "journey", "learning"] },
  { title: "Tokyo on a Student Budget — A Dream Itinerary", category: "Japan", tags: ["tokyo", "travel", "budget"] },
  { title: "Why Every Developer Should Learn to Touch Type", category: "Career", tags: ["typing", "productivity", "skills"] },
  { title: "Cloud Computing for Students — Where to Actually Start", category: "Career", tags: ["cloud", "students", "learning"] },
  { title: "Dark Fiction Writing — How to Build Dread Without Gore", category: "Creative Writing", tags: ["darkfiction", "writing", "dread"] },
  { title: "Building a Dark Academia Writing Routine", category: "Creative Writing", tags: ["writing", "routine", "darkacademia"] }
];

/**
 * Seeds the database with default admin credentials and 25 posts.
 */
async function seed() {
  console.log('Starting Database Seeding...');
  
  try {
    // 1. Initialize tables first (if using MySQL)
    await initDb();

    // 2. Check if admin exists
    const adminEmail = 'admin@rohit.com';
    let admin = await dbService.getUserByEmail(adminEmail);

    if (admin) {
      console.log(`Admin user "${adminEmail}" already exists. Skipping insertion.`);
    } else {
      // 3. Hash password
      const passwordPlain = 'admin123';
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(passwordPlain, salt);

      // 4. Create admin
      admin = await dbService.createUser(
        'Rohit',
        adminEmail,
        passwordHash,
        'admin',
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80'
      );

      console.log('--------------------------------------------------');
      console.log('Admin user seeded successfully!');
      console.log(`Email:    ${admin.email}`);
      console.log(`Password: ${passwordPlain}`);
      console.log(`Role:     ${admin.role}`);
      console.log('--------------------------------------------------');
    }
    
    // Seed 25 Articles
    console.log('Seeding posts...');
    let addedCount = 0;
    
    for (const post of postsToSeed) {
      const slug = post.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const existingPost = await dbService.getPostBySlug(slug);
      
      if (!existingPost) {
        const content = categoryContent[post.category] || categoryContent['Technology'];
        
        const categoryImages: Record<string, string> = {
          Technology: 'https://source.unsplash.com/800x500/?technology',
          Fitness: 'https://source.unsplash.com/800x500/?fitness',
          Anime: 'https://source.unsplash.com/800x500/?anime',
          Chess: 'https://source.unsplash.com/800x500/?chess',
          Philosophy: 'https://source.unsplash.com/800x500/?philosophy',
          Japan: 'https://source.unsplash.com/800x500/?japan',
          Career: 'https://source.unsplash.com/800x500/?career',
          "Creative Writing": 'https://source.unsplash.com/800x500/?writing',
        };

        const coverImage = categoryImages[post.category] || categoryImages['Technology'];

        await dbService.createPost(
          admin.id,
          post.title,
          slug,
          content,
          coverImage, // use coverImage based on category
          post.category,
          'published',
          post.tags
        );
        addedCount++;
        console.log(`Seeded post: ${post.title}`);
      }
    }
    
    console.log(`Seeded ${addedCount} new posts.`);
    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed with error:', error);
    process.exit(1);
  }
}

seed();
