(function(){
  'use strict';
  document.addEventListener('DOMContentLoaded', function(){
    // Highlight current nav link
    var navLinks = document.querySelectorAll('.main-nav a');
    var path = location.pathname.split('/').pop();
    if(!path) path = 'adi.html';
    navLinks.forEach(function(a){
      var href = a.getAttribute('href');
      if(href === path || (href === 'adi.html' && (path === '' || path === 'index.html'))){
        a.classList.add('active');
      }
    });

    // Small helper: toast notifications
    function showToast(msg, timeout){
      timeout = timeout || 3000;
      var t = document.createElement('div');
      t.className = 'site-toast';
      t.textContent = msg;
      document.body.appendChild(t);
      window.setTimeout(function(){ t.classList.add('visible'); }, 20);
      window.setTimeout(function(){ t.classList.remove('visible'); window.setTimeout(function(){ t.remove(); },300); }, timeout);
    }

    // Handle contact form: send to API if provided, otherwise fallback to mailto
    var contactForm = document.querySelector('#contact-form') || document.querySelector('form[data-api], form[action^="mailto:"]');
    if(contactForm){
      var nameEl = contactForm.querySelector('#name');
      var emailEl = contactForm.querySelector('#email');
      var msgEl = contactForm.querySelector('#message');
      var apiUrl = contactForm.dataset.api || window.CONTACT_API_URL || '';
      var mailtoFallback = contactForm.dataset.mailto || contactForm.getAttribute('action') || '';
      contactForm.addEventListener('submit', function(e){
        e.preventDefault();
        var name = nameEl ? nameEl.value.trim() : '';
        var email = emailEl ? emailEl.value.trim() : '';
        var message = msgEl ? msgEl.value.trim() : '';
        if(!name){ showToast('Please enter your name'); if(nameEl) nameEl.focus(); return; }
        var emailRe = /^\S+@\S+\.\S+$/;
        if(!email || !emailRe.test(email)){ showToast('Please enter a valid email address'); if(emailEl) emailEl.focus(); return; }
        if(!message){ showToast('Please enter a message'); if(msgEl) msgEl.focus(); return; }

        if(apiUrl){
          // send JSON to API endpoint
          fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: name, email: email, message: message })
          }).then(function(resp){
            if(resp.ok) { showToast('Message sent — thank you!'); contactForm.reset(); }
            else { showToast('Send failed — please try again later'); }
          }).catch(function(){ showToast('Send failed — check your network'); });
        } else if(mailtoFallback && mailtoFallback.indexOf('mailto:') === 0){
          var subject = encodeURIComponent('Message from ' + name);
          var body = encodeURIComponent('Name: ' + name + '\nEmail: ' + email + '\n\n' + message);
          window.location.href = mailtoFallback + '?subject=' + subject + '&body=' + body;
        } else {
          showToast('No contact endpoint configured.');
        }
      });
    }

    // Replace simple alerts with toast when available
    if(typeof showToast === 'function'){
      // monkey-patch alert usage in this scope by redefining alert to use toast
      window.alert = function(msg){ showToast(msg); };
    }

    // Smooth scroll for in-page anchors
    document.querySelectorAll('a[href^="#"]').forEach(function(a){
      a.addEventListener('click', function(e){
        var targetId = a.getAttribute('href').slice(1);
        var target = document.getElementById(targetId);
        if(target){
          e.preventDefault();
          target.scrollIntoView({behavior:'smooth', block:'start'});
          try{ history.replaceState(null, '', '#'+targetId); } catch(e){}
        }
      });
    });

    // Small accessibility tweak: show focus outlines when navigating with keyboard
    var usingMouse = false;
    document.addEventListener('mousedown', function(){ usingMouse = true; document.documentElement.classList.add('using-mouse'); });
    document.addEventListener('keydown', function(e){ if(e.key === 'Tab'){ usingMouse = false; document.documentElement.classList.remove('using-mouse'); }});

    // Mobile nav toggle
    var navToggle = document.querySelector('.nav-toggle');
    var mainNav = document.querySelector('.main-nav');
    if(navToggle && mainNav){
      navToggle.addEventListener('click', function(){
        var expanded = this.getAttribute('aria-expanded') === 'true';
        this.setAttribute('aria-expanded', String(!expanded));
        document.documentElement.classList.toggle('nav-open');
      });
    }

    // Project filters
    var filterContainer = document.querySelector('.project-filters');
    if(filterContainer){
      var projects = Array.from(document.querySelectorAll('.project-card'));
      filterContainer.addEventListener('click', function(e){
        var btn = e.target.closest('button');
        if(!btn) return;
        var tag = btn.dataset.tag;
        filterContainer.querySelectorAll('button').forEach(function(b){ b.classList.remove('active'); });
        btn.classList.add('active');
        projects.forEach(function(p){
          var tags = (p.dataset.tags||'').split(/\s+/).filter(Boolean);
          if(tag === 'all' || tags.indexOf(tag) !== -1) p.style.display = '';
          else p.style.display = 'none';
        });
      });
    }

    // Project modal view with focus trap and richer content
    var modal = document.querySelector('.project-modal');
    if(modal){
      var lastFocused = null;
      var focusableSelector = 'a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])';
      function trapFocus(e){
        var focusable = Array.from(modal.querySelectorAll(focusableSelector)).filter(function(n){ return n.offsetParent !== null; });
        if(focusable.length === 0) return;
        var first = focusable[0];
        var last = focusable[focusable.length-1];
        if(e.key === 'Tab'){
          if(e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
          else if(!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
        } else if(e.key === 'Escape'){
          closeModal();
        }
      }
      function openModal(){ modal.classList.add('open'); modal.setAttribute('aria-hidden','false'); lastFocused = document.activeElement; document.body.style.overflow = 'hidden';
        var focusable = Array.from(modal.querySelectorAll(focusableSelector)).filter(function(n){ return n.offsetParent !== null; });
        if(focusable.length) focusable[0].focus();
        document.addEventListener('keydown', trapFocus);
      }
      function closeModal(){ modal.classList.remove('open'); modal.setAttribute('aria-hidden','true'); document.body.style.overflow = ''; document.removeEventListener('keydown', trapFocus); if(lastFocused) lastFocused.focus(); }

      document.querySelectorAll('.project-card').forEach(function(card){
        card.style.cursor = 'pointer';
        card.addEventListener('click', function(){
          var title = (card.querySelector('h3')||{}).textContent || '';
          var desc = (card.querySelector('p')||{}).textContent || '';
          var tech = (card.querySelector('.project-tech')||{}).textContent || '';
          var img = card.dataset.image || '';
          var link = card.dataset.link || '';
          modal.querySelector('.modal-title').textContent = title.trim();
          var mediaEl = modal.querySelector('.modal-media');
          var imgEl = modal.querySelector('.modal-media img');
          var contentEl = modal.querySelector('.modal-body');
          var actionsEl = modal.querySelector('.modal-actions');
          if(img && imgEl){ imgEl.src = img; imgEl.style.display = ''; } else if(imgEl){ imgEl.style.display = 'none'; }
          contentEl.textContent = desc.trim() + '\n\n' + tech.trim();
          actionsEl.innerHTML = '';
          if(link){
            var a = document.createElement('a'); a.href = link; a.target = '_blank'; a.rel = 'noopener'; a.className = 'button button-secondary'; a.textContent = 'Open project';
            actionsEl.appendChild(a);
          }
          openModal();
        });
      });
      var closeBtn = modal.querySelector('.modal-close');
      if(closeBtn) closeBtn.addEventListener('click', closeModal);
      modal.addEventListener('click', function(e){ if(e.target === modal){ closeModal(); } });
    }
  });
})();
