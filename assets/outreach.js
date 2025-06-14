// Blogger API Configuration
const apiKey = "AIzaSyDr43eC6fFXL2Of2YhiE7kQ5GYZrakZuVM"; // Replace with your API key
const blogId = "4965865746695450635"; // Replace with your Blogger Blog ID
const tagName = "outreach"; // The tag to filter posts by

// Function to extract and truncate excerpts from post content
function getExcerpt(content, maxLength = 100) {
    const plainText = content.replace(/<\/?[^>]+(>|$)/g, "");
    return plainText.length > maxLength ? plainText.substring(0, maxLength) + "..." : plainText;
}

// Function to extract an image from post content
function extractImageFromContent(content) {
    const imgRegex = /<img[^>]+src="([^">]+)"/;
    const match = content.match(imgRegex);
    return match ? match[1] : "placeholder.jpg";
}

// Function to fetch posts with the 'outreach' label
async function fetchOutreachPosts() {
    const url = `https://www.googleapis.com/blogger/v3/blogs/${blogId}/posts?key=${apiKey}&labels=${encodeURIComponent(tagName)}`;
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data.items || [];
    } catch (error) {
        console.error("Error fetching posts:", error);
        return [];
    }
}

// Function to render outreach posts
async function renderOutreach() {
    const container = document.getElementById("outreach-container");

    try {
        const allOutreachPosts = await fetchOutreachPosts();

        if (!allOutreachPosts.length) {
            container.innerHTML = "<p>No outreach posts available.</p>";
            return;
        }

        const postsToRender = allOutreachPosts.slice(0, 8); // Get the most recent 8 posts
        postsToRender.sort((a, b) => new Date(b.published) - new Date(a.published)); // Sort by date (most recent first)

        postsToRender.forEach(post => {
            const card = document.createElement("div");
            card.classList.add("post-card");

            const imageUrl = extractImageFromContent(post.content || "");

            card.innerHTML = `
                <img src="${imageUrl}" alt="${post.title}">
                <div class="content">
                    <h3>${post.title}</h3>
                    <p class="date">${new Date(post.published).toLocaleDateString()}</p>
                    <p>${getExcerpt(post.content || "No content available.")}</p>
                    <a href="${post.url}" target="_blank">Read More</a>
                </div>
            `;

            container.appendChild(card);
        });
    } catch (error) {
        console.error("Error rendering outreach posts:", error);
        container.innerHTML = "<p>Error loading posts. Please try again later.</p>";
    }
}

// Initialize rendering
renderOutreach();
