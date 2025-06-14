// Blogger API Configuration
const BLOG_SECTION_API_KEY = "AIzaSyDr43eC6fFXL2Of2YhiE7kQ5GYZrakZuVM";
const BLOG_SECTION_BLOG_ID = "4965865746695450635";

// Global variables
let blogSectionCurrentPost = null;

// Utility functions
function blogSectionGetExcerpt(content, maxLength = 100) {
    const plainText = content.replace(/<\/?[^>]+(>|$)/g, "");
    return plainText.length > maxLength ? plainText.substring(0, maxLength) + "..." : plainText;
}

function blogSectionExtractImage(content) {
    const imgRegex = /<img[^>]+src="([^">]+)"/i;
    const match = content.match(imgRegex);
    return match ? match[1] : 'https://via.placeholder.com/600x400?text=No+Image';
}

function blogSectionFormatDate(dateString) {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleString('default', { month: 'short' }).toUpperCase();
    return { day, month };
}

// Fetch posts from Blogger
async function blogSectionFetchPosts() {
    const url = `https://www.googleapis.com/blogger/v3/blogs/${BLOG_SECTION_BLOG_ID}/posts?key=${BLOG_SECTION_API_KEY}&maxResults=20`;
    
    try {
        blogSectionShowLoading();
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return data.items || [];
    } catch (error) {
        console.error("Error fetching posts:", error);
        blogSectionShowError();
        return [];
    }
}

// Display posts
async function blogSectionDisplayPosts() {
    const posts = await blogSectionFetchPosts();
    if (posts.length === 0) return;
    
    // Sort by date (newest first)
    posts.sort((a, b) => new Date(b.published) - new Date(a.published));
    
    // Get all non-featured posts
    const nonFeaturedPosts = posts.filter(post => 
        !post.labels || !post.labels.includes('featured')
    );
    
    // Get only featured posts
    const featuredPosts = posts.filter(post => 
        post.labels && post.labels.includes('featured')
    );
    
    // Take 2 most recent non-featured posts
    const recentPosts = nonFeaturedPosts.slice(0, 2);
    
    // Take 2 most recent featured posts
    const selectedFeaturedPosts = featuredPosts.slice(0, 2);
    
    // Combine them (total of 4 posts)
    const displayPosts = [...recentPosts, ...selectedFeaturedPosts];
    
    // If we don't have 4 posts, fill with additional non-featured posts
    if (displayPosts.length < 4) {
        const remainingPosts = nonFeaturedPosts.slice(2, 4 - selectedFeaturedPosts.length);
        displayPosts.push(...remainingPosts);
    }
    
    const container = document.getElementById('blog-section-posts');
    container.innerHTML = '';
    
    displayPosts.forEach(post => {
        const imageUrl = blogSectionExtractImage(post.content);
        const date = blogSectionFormatDate(post.published);
        const excerpt = blogSectionGetExcerpt(post.content);
        
        const postElement = document.createElement('div');
        postElement.className = 'blog-section-post';
        postElement.innerHTML = `
            <div class="blog-section-post-img">
                <img src="${imageUrl}" alt="${post.title}">
                <div class="blog-section-post-date">
                    <span>${date.day}</span>
                    <small>${date.month}</small>
                </div>
            </div>
            <div class="blog-section-post-content">
                <h3>${post.title}</h3>
                <p>${excerpt}</p>
                <a href="#" class="blog-section-read-more" onclick="blogSectionOpenPost('${post.id}'); return false;">READ MORE</a>
            </div>
        `;
        
        container.appendChild(postElement);
    });
    
    blogSectionHideLoading();
}

// Modal functions
function blogSectionOpenPost(postId) {
    blogSectionFetchPosts().then(posts => {
        const post = posts.find(p => p.id === postId);
        if (!post) return;
        
        blogSectionCurrentPost = post;
        
        document.getElementById('blog-section-modal-title').textContent = post.title;
        document.getElementById('blog-section-modal-date').textContent = new Date(post.published).toLocaleDateString();
        
        // Process content to make images responsive
        let content = post.content || 'No content available.';
        content = content.replace(/<img/g, '<img style="max-width:100%; height:auto;"');
        
        document.getElementById('blog-section-modal-content').innerHTML = content;
        document.getElementById('blog-section-modal').classList.add('show');
        document.body.style.overflow = 'hidden';
    });
}

function blogSectionCloseModal() {
    document.getElementById('blog-section-modal').classList.remove('show');
    document.body.style.overflow = 'auto';
    blogSectionCurrentPost = null;
}

// Share functions
function blogSectionSharePost(platform) {
    if (!blogSectionCurrentPost) return;
    
    const url = encodeURIComponent(blogSectionCurrentPost.url);
    const title = encodeURIComponent(blogSectionCurrentPost.title);
    let shareUrl = '';
    
    switch (platform) {
        case 'facebook':
            shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
            break;
        case 'twitter':
            shareUrl = `https://twitter.com/intent/tweet?url=${url}&text=${title}`;
            break;
    }
    
    if (shareUrl) {
        window.open(shareUrl, '_blank', 'width=600,height=400');
    }
}

function blogSectionCopyLink() {
    if (!blogSectionCurrentPost) return;
    
    navigator.clipboard.writeText(blogSectionCurrentPost.url).then(() => {
        const btn = event.target.closest('.blog-section-share-btn');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="bi bi-check"></i> Copied!';
        setTimeout(() => {
            btn.innerHTML = originalText;
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy: ', err);
    });
}

// Loading states
function blogSectionShowLoading() {
    document.querySelector('.blog-section-spinner').classList.add('show');
    document.querySelector('.blog-section-error').classList.remove('show');
}

function blogSectionHideLoading() {
    document.querySelector('.blog-section-spinner').classList.remove('show');
}

function blogSectionShowError() {
    document.querySelector('.blog-section-error').classList.add('show');
    document.querySelector('.blog-section-spinner').classList.remove('show');
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    // Load posts
    blogSectionDisplayPosts();
    
    // Retry button
    document.querySelector('.blog-section-retry-btn').addEventListener('click', blogSectionDisplayPosts);
    
    // Close modal when clicking outside
    document.getElementById('blog-section-modal').addEventListener('click', function(e) {
        if (e.target === this) {
            blogSectionCloseModal();
        }
    });
    
    // Close modal with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && document.getElementById('blog-section-modal').classList.contains('show')) {
            blogSectionCloseModal();
        }
    });
});