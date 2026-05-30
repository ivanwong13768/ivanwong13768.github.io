// Course Modal Manager
class CourseModal {
  constructor() {
    this.modal = document.getElementById('courseModal');
    this.closeBtn = document.querySelector('.modal-close');
    this.init();
  }

  init() {
    // Close modal when X is clicked
    this.closeBtn.addEventListener('click', () => this.close());
    
    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
      if (e.target === this.modal) {
        this.close();
      }
    });

    // Close modal with Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.close();
      }
    });

    // Set up click handlers for course titles
    this.setupCourseClickHandlers();
  }

  setupCourseClickHandlers() {
    // Find all course titles (li elements in .course-semester) and make them clickable
    document.querySelectorAll('.course-semester li').forEach(li => {
      li.style.cursor = 'pointer';
      li.addEventListener('click', (e) => {
        e.preventDefault();
        // Extract course code from first word (e.g., "COMP2011" from "COMP2011 - Programming with C++")
        const courseCode = li.textContent.trim().split(' ')[0];
        this.open(courseCode);
      });
      li.addEventListener('mouseover', () => {
        li.style.opacity = '0.8';
        li.style.textDecoration = 'underline';
      });
      li.addEventListener('mouseout', () => {
        li.style.opacity = '1';
        li.style.textDecoration = 'none';
      });
    });
  }

  async open(courseCode) {
    const data = await this.loadCourseData(courseCode);
    if (data) {
      this.populateModal(data);
      this.modal.classList.add('active');
    }
  }

  close() {
    this.modal.classList.remove('active');
  }

  async loadCourseData(courseCode) {
    try {
      // Load JSON data
      const dataResponse = await fetch(`/courses/${courseCode}/data.json`);
      const data = await dataResponse.json();

      // Load text files
      const contentResponse = await fetch(`/courses/${courseCode}/content.txt`);
      const content = await contentResponse.text();

      const gradingResponse = await fetch(`/courses/${courseCode}/grading.txt`);
      const grading = await gradingResponse.text();

      const teachingResponse = await fetch(`/courses/${courseCode}/teaching.txt`);
      const teaching = await teachingResponse.text();

      const workloadResponse = await fetch(`/courses/${courseCode}/workload.txt`);
      const workload = await workloadResponse.text();

      const recommendationsResponse = await fetch(`/courses/${courseCode}/recommendations.txt`);
      const recommendations = await recommendationsResponse.text();

      // Load materials
      const materialsResponse = await fetch(`/courses/${courseCode}/materials.json`);
      const materials = await materialsResponse.json();

      return {
        ...data,
        content,
        grading,
        teaching,
        workload,
        recommendations,
        materials
      };
    } catch (error) {
      console.error('Error loading course data:', error);
      alert('Course data not found. This course may not have reviews yet.');
      return null;
    }
  }

  populateModal(data) {
    // Set header
    document.getElementById('courseTitle').textContent = data.code + ' - ' + data.title;
    
    // Set info boxes
    document.getElementById('courseCode').textContent = data.code;
    document.getElementById('courseFullTitle').textContent = data.title;
    document.getElementById('courseCredits').textContent = data.credits;
    document.getElementById('courseGrade').textContent = data.grade;
    
    // Set instructor
    document.getElementById('courseInstructor').textContent = data.instructor || '';
    
    // Set link
    document.getElementById('courseLink').textContent = data.link;
    
    // Set ratings
    this.setRating('Content', data.ratings.content);
    this.setRating('Grading', data.ratings.grading);
    this.setRating('Teaching', data.ratings.teaching);
    this.setRating('Workload', data.ratings.workload);
    
    // Set review texts with markdown rendering
    document.getElementById('reviewContent').innerHTML = this.renderMarkdown(data.content);
    document.getElementById('reviewGrading').innerHTML = this.renderMarkdown(data.grading);
    document.getElementById('reviewTeaching').innerHTML = this.renderMarkdown(data.teaching);
    document.getElementById('reviewWorkload').innerHTML = this.renderMarkdown(data.workload);
    
    // Set recommendations with markdown rendering
    document.getElementById('recommendationsText').innerHTML = this.renderMarkdown(data.recommendations);
    
    // Set materials table
    const materialsBody = document.getElementById('materialsBody');
    materialsBody.innerHTML = '';
    data.materials.forEach(material => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${material.type}</td>
        <td><a href="${material.link}" target="_blank">${material.link}</a></td>
      `;
      materialsBody.appendChild(row);
    });
  }

  setRating(label, rating) {
    const ratingElementMap = {
      'Content': 'ratingContent',
      'Grading': 'ratingGrading',
      'Teaching': 'ratingTeaching',
      'Workload': 'ratingWorkload'
    };

    const element = document.getElementById(ratingElementMap[label]);
    if (element) {
      element.textContent = rating;
      element.className = `rating-badge rating-${rating}`;
    }
  }

  // Simple markdown to HTML converter
  renderMarkdown(text) {
    if (!text || text.trim() === '') return '';
    
    let html = text
      // Bold: **text** or __text__
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/__(.+?)__/g, '<strong>$1</strong>')
      // Italic: *text* or _text_
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/_(.+?)_/g, '<em>$1</em>')
      // Code: `text`
      .replace(/`(.+?)`/g, '<code>$1</code>')
      // Links: [text](url)
      .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank">$1</a>')
      // Paragraphs: split by double newline
      .split(/\n\n+/).map(para => `<p>${para.trim()}</p>`).join('');
    
    return html;
  }
}

// Theme Manager
class ThemeManager {
  constructor() {
    this.themes = ['dark', 'light'];
    this.storageKey = 'website-theme';
    this.init();
  }

  init() {
    const savedTheme = localStorage.getItem(this.storageKey);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = savedTheme || (prefersDark ? 'dark' : 'dark');
    this.setTheme(theme, false);
  }

  setTheme(theme, save = true) {
    if (!this.themes.includes(theme)) return;
    
    if (theme === 'dark') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', theme);
      // Trigger flashlight effect when switching to light mode
      this.triggerFlashlight();
    }
    
    if (save) {
      localStorage.setItem(this.storageKey, theme);
    }
    
    this.updateThemeButton(theme);
  }

  triggerFlashlight() {
    const flashlight = document.createElement('div');
    flashlight.className = 'flashlight';
    document.body.appendChild(flashlight);
    
    // Remove the flashlight element after animation completes
    setTimeout(() => {
      flashlight.remove();
    }, 800);
  }

  toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    this.setTheme(next);
  }

  updateThemeButton(theme) {
    const btn = document.getElementById('theme-toggle-btn');
    if (btn) {
      btn.innerHTML = theme === 'dark' ? '☀️' : '🌙';
    }
  }

  getCurrentTheme() {
    return document.documentElement.getAttribute('data-theme') || 'dark';
  }
}

// Simple Single-Page Application Router
class Router {
  constructor() {
    this.currentPage = 'home';
    this.init();
  }

  init() {
    // Set up navigation click handlers
    this.setupNavigation();
    
    // Handle browser back/forward
    window.addEventListener('popstate', (e) => {
      if (e.state && e.state.page) {
        this.navigateTo(e.state.page, false);
      }
    });

    // Load initial page
    const path = window.location.hash.slice(1) || 'home';
    this.navigateTo(path, false);
  }

  setupNavigation() {
    document.querySelectorAll('nav a, nav button[data-page]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const page = link.getAttribute('data-page');
        this.navigateTo(page);
      });
    });
  }

  navigateTo(page, pushHistory = true) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(p => {
      p.classList.remove('active');
    });

    // Show selected page
    const pageElement = document.getElementById(page);
    if (pageElement) {
      pageElement.classList.add('active');
      this.currentPage = page;

      // Update active nav button
      document.querySelectorAll('nav a, nav button[data-page]').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-page') === page) {
          link.classList.add('active');
        }
      });

      // Update browser history
      if (pushHistory) {
        window.history.pushState(
          { page },
          '',
          `#${page}`
        );
      }

      // Scroll to top
      window.scrollTo(0, 0);
    }
  }

  getCurrentPage() {
    return this.currentPage;
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.themeManager = new ThemeManager();
  window.courseModal = new CourseModal();
  window.router = new Router();
  
  // Set up theme toggle button
  const themeBtn = document.getElementById('theme-toggle-btn');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      window.themeManager.toggleTheme();
    });
  }
});
