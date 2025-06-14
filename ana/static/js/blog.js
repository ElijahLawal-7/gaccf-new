// Blogger API Configuration
const API_KEY = "AIzaSyDr43eC6fFXL2Of2YhiE7kQ5GYZrakZuVM"; // Replace with your API key
const BLOG_ID = "4965865746695450635"; // Replace with your Blogger Blog ID
const POSTS_PER_PAGE = 8;

// Global variables
let allPosts = [];
let currentPage = 1;
let currentPost = null;

// Utility functions
function getExcerpt(content, maxLength = 150) {
    const plainText = content.replace(/<\/?[^>]+(>|$)/g, "");
    return plainText.length > maxLength ? plainText.substring(0, maxLength) + "..." : plainText;
}

function extractMediaFromContent(content) {
    // Extract first image
    const imgRegex = /<img[^>]+src="([^">]+)"/i;
    const imgMatch = content.match(imgRegex);
    
    // Extract first video
    const videoRegex = /<video[^>]+src="([^">]+)"|<iframe[^>]+src="([^">]+youtube\.com[^">]+)"/i;
    const videoMatch = content.match(videoRegex);
    
    return {
        image: imgMatch ? imgMatch[1] : null,
        video: videoMatch ? (videoMatch[1] || videoMatch[2]) : null
    };
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
    const year = date.getFullYear();
    return { day, month, year, full: date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) };
}

// API functions
async function fetchBlogPosts() {
    const url = `https://www.googleapis.com/blogger/v3/blogs/${BLOG_ID}/posts?key=${API_KEY}&maxResults=50`;
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data.items || [];
    } catch (error) {
        console.error("Error fetching posts:", error);
        throw error;
    }
}

// Rendering functions
function renderBlogPosts(posts, page = 1) {
    const container = document.getElementById('blog-posts-container');
    const startIndex = (page - 1) * POSTS_PER_PAGE;
    const endIndex = startIndex + POSTS_PER_PAGE;
    const postsToShow = posts.slice(startIndex, endIndex);
    
    container.innerHTML = '';
    
    if (postsToShow.length === 0) {
        container.innerHTML = '<div class="col-12"><p class="text-center">No posts found.</p></div>';
        return;
    }
    
    postsToShow.forEach(post => {
        const media = extractMediaFromContent(post.content || "");
        const dateInfo = formatDate(post.published);
        
        const postElement = document.createElement('div');
        postElement.className = 'col-sm-6';
        
        let mediaElement = '';
        if (media.video) {
            if (media.video.includes('youtube.com') || media.video.includes('youtu.be')) {
                const videoId = extractYouTubeId(media.video);
                mediaElement = `
                    <div class="video-container">
                        <iframe src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen></iframe>
                    </div>
                `;
            } else {
                mediaElement = `<video controls><source src="${media.video}" type="video/mp4"></video>`;
            }
        } else if (media.image) {
            mediaElement = `<img src="${media.image}" alt="${post.title}" loading="lazy">`;
        } else {
            mediaElement = `<img src="static/img/blog-placeholder.jpg" alt="${post.title}" loading="lazy">`;
        }
        
        postElement.innerHTML = `
            <div class="blog-post">
                <div class="blog-img">
                    <a href="#" onclick="openPost('${post.id}'); return false;">
                        <div class="data">
                            <span>${dateInfo.day}</span>
                            <small>${dateInfo.month}</small>
                        </div>
                        ${mediaElement}
                    </a>
                </div>
                <div class="blog-info">
                    <h6><a href="#" onclick="openPost('${post.id}'); return false;">${post.title}</a></h6>
                    <p>${getExcerpt(post.content || "No content available.")}</p>
                    <div class="btn-bar">
                        <a href="#" onclick="openPost('${post.id}'); return false;" class="px-btn-arrow">
                            <span>Read More</span>
                            <i class="arrow"></i>
                        </a>
                    </div>
                </div>
            </div>
        `;
        
        container.appendChild(postElement);
    });
    
    renderPagination(posts.length, page);
}

function renderPagination(totalPosts, currentPage) {
    const totalPages = Math.ceil(totalPosts / POSTS_PER_PAGE);
    const container = document.getElementById('pagination-container');
    
    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }
    
    let paginationHTML = '';
    
    // Previous button
    paginationHTML += `
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changePage(${currentPage - 1}); return false;" tabindex="-1">
                <i class="bi bi-chevron-left"></i>
            </a>
        </li>
    `;
    
    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
            paginationHTML += `
                <li class="page-item ${i === currentPage ? 'active' : ''}">
                    <a class="page-link" href="#" onclick="changePage(${i}); return false;">${i}</a>
                </li>
            `;
        } else if (i === currentPage - 2 || i === currentPage + 2) {
            paginationHTML += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
        }
    }
    
    // Next button
    paginationHTML += `
        <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changePage(${currentPage + 1}); return false;">
                <i class="bi bi-chevron-right"></i>
            </a>
        </li>
    `;
    
    container.innerHTML = paginationHTML;
}

function renderSidebarPosts() {
    // Render trending posts (posts with most engagement or recent featured posts)
    const trendingPosts = allPosts.filter(post => 
        post.labels && post.labels.includes('Featured')
    ).slice(0, 3);
    
    const trendingContainer = document.getElementById('trending-posts');
    trendingContainer.innerHTML = '';
    
    if (trendingPosts.length > 0) {
        trendingPosts.forEach(post => {
            const media = extractMediaFromContent(post.content || "");
            const dateInfo = formatDate(post.published);
            
            const slideElement = document.createElement('div');
            slideElement.className = 'post-aside';
            slideElement.innerHTML = `
                <div class="post-aside-title">
                    <h5><a href="#" onclick="openPost('${post.id}'); return false;">${post.title}</a></h5>
                </div>
                <div class="post-aside-meta">
                    <a class="name" href="#" onclick="openPost('${post.id}'); return false;">
                        ${post.author ? post.author.displayName : 'Zemo Roth'}
                    </a>
                    <a class="date" href="#" onclick="openPost('${post.id}'); return false;">
                        ${dateInfo.full}
                    </a>
                </div>
                <div class="post-aside-img">
                    <a href="#" onclick="openPost('${post.id}'); return false;">
                        <img src="${media.image || 'static/img/blog-placeholder.jpg'}" alt="${post.title}">
                    </a>
                </div>
            `;
            
            trendingContainer.appendChild(slideElement);
        });
    }
    
    // Render latest posts
    const latestPosts = allPosts.slice(0, 3);
    const latestContainer = document.getElementById('latest-posts');
    latestContainer.innerHTML = '';
    
    latestPosts.forEach(post => {
        const media = extractMediaFromContent(post.content || "");
        const dateInfo = formatDate(post.published);
        
        const postElement = document.createElement('div');
        postElement.className = 'latest-post-aside media d-flex';
        postElement.innerHTML = `
            <div class="lpa-left media-body col pe-3">
                <div class="lpa-title">
                    <h5><a href="#" onclick="openPost('${post.id}'); return false;">${post.title}</a></h5>
                </div>
                <div class="lpa-meta">
                    <a class="name" href="#" onclick="openPost('${post.id}'); return false;">
                        ${post.author ? post.author.displayName : 'Zemo Roth'}
                    </a>
                    <a class="date" href="#" onclick="openPost('${post.id}'); return false;">
                        ${dateInfo.full}
                    </a>
                </div>
            </div>
            <div class="lpa-right">
                <a href="#" onclick="openPost('${post.id}'); return false;">
                    <img src="${media.image || 'static/img/blog-placeholder.jpg'}" alt="${post.title}">
                </a>
            </div>
        `;
        
        latestContainer.appendChild(postElement);
    });
    
    // Render tags
    const tags = new Set();
    allPosts.forEach(post => {
        if (post.labels) {
            post.labels.forEach(label => tags.add(label));
        }
    });
    
    const tagsContainer = document.getElementById('tags-container');
    tagsContainer.innerHTML = '';
    
    Array.from(tags).slice(0, 10).forEach(tag => {
        const tagElement = document.createElement('a');
        tagElement.href = '#';
        tagElement.textContent = tag;
        tagElement.onclick = (e) => {
            e.preventDefault();
            filterPostsByTag(tag);
        };
        tagsContainer.appendChild(tagElement);
    });
}

// Modal functions
function openPost(postId) {
    const post = allPosts.find(p => p.id === postId);
    if (!post) return;
    
    currentPost = post;
    
    document.getElementById('modal-title').textContent = post.title;
    document.getElementById('modal-date').textContent = formatDate(post.published).full;
    
    // Process content to make images responsive
    let content = post.content || 'No content available.';
    content = content.replace(/<img/g, '<img style="max-width:100%; height:auto;"');
    content = content.replace(/<iframe/g, '<iframe style="max-width:100%;"');
    
    document.getElementById('modal-content').innerHTML = content;
    
    document.getElementById('post-modal').classList.add('show');
    document.body.style.overflow = 'hidden';
    
    // Scroll to top of modal
    document.querySelector('.modal-content').scrollTop = 0;
}

function closeModal() {
    document.getElementById('post-modal').classList.remove('show');
    document.body.style.overflow = 'auto';
    currentPost = null;
}

// Share functions
function sharePost(platform) {
    if (!currentPost) return;
    
    const url = encodeURIComponent(currentPost.url);
    const title = encodeURIComponent(currentPost.title);
    
    let shareUrl = '';
    
    switch (platform) {
        case 'facebook':
            shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
            break;
        case 'twitter':
            shareUrl = `https://twitter.com/intent/tweet?url=${url}&text=${title}`;
            break;
        case 'linkedin':
            shareUrl = `https://www.linkedin.com/shareArticle?mini=true&url=${url}&title=${title}`;
            break;
    }
    
    if (shareUrl) {
        window.open(shareUrl, '_blank', 'width=600,height=400');
    }
}

function copyPostLink() {
    if (!currentPost) return;
    
    navigator.clipboard.writeText(currentPost.url).then(() => {
        // Show success message
        const btn = event.target.closest('.share-btn');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="bi bi-check"></i> Copied!';
        setTimeout(() => {
            btn.innerHTML = originalText;
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy: ', err);
    });
}

// Utility functions
function extractYouTubeId(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

function changePage(page) {
    if (page < 1 || page > Math.ceil(allPosts.length / POSTS_PER_PAGE)) return;
    
    currentPage = page;
    renderBlogPosts(allPosts, currentPage);
    
    // Scroll to top of blog section
    document.getElementById('blog').scrollIntoView({ behavior: 'smooth' });
}

function filterPostsByTag(tag) {
    const filteredPosts = allPosts.filter(post => 
        post.labels && post.labels.includes(tag)
    );
    currentPage = 1;
    renderBlogPosts(filteredPosts.length > 0 ? filteredPosts : allPosts, currentPage);
}

function showLoading() {
    document.getElementById('loading-spinner').classList.add('show');
    document.getElementById('error-message').classList.remove('show');
}

function hideLoading() {
    document.getElementById('loading-spinner').classList.remove('show');
}

function showError() {
    document.getElementById('error-message').classList.add('show');
    document.getElementById('loading-spinner').classList.remove('show');
}

// Initialize the blog
async function loadBlogPosts() {
    showLoading();
    
    try {
        allPosts = await fetchBlogPosts();
        
        // Sort posts by date (newest first)
        allPosts.sort((a, b) => new Date(b.published) - new Date(a.published));
        
        renderBlogPosts(allPosts, currentPage);
        renderSidebarPosts();
        hideLoading();
    } catch (error) {
        console.error("Failed to load blog posts:", error);
        showError();
    }
}

// Close modal when clicking outside content
document.getElementById('post-modal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeModal();
    }
});

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    loadBlogPosts();
    
    // Close modal with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && document.getElementById('post-modal').classList.contains('show')) {
            closeModal();
        }
    });
});