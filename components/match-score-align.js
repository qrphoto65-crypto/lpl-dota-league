(() => {
 const fixtures = [...document.querySelectorAll('.fixture-versus')];
 function align() {
  fixtures.forEach(fixture => {
   const score = fixture.querySelector('.empty-score');
   const number = score?.querySelector('.score-value');
   const avatar = fixture.querySelector('.filled-slot img, .empty-slot');
   if (!score || !number || !avatar) return;
   score.style.transform = 'none';
   score.style.removeProperty('height');
   if (window.matchMedia('(max-width:768px)').matches) return;
   const photo = avatar.getBoundingClientRect();
   if (avatar.classList.contains('empty-slot')) {
    score.style.height = `${photo.height}px`;
    const ticket = score.getBoundingClientRect();
    score.style.transform = `translateY(${photo.top - ticket.top}px)`;
    return;
   }
   const digits = number.getBoundingClientRect();
   score.style.transform = `translateY(${photo.top + photo.height / 2 - digits.top - digits.height / 2}px)`;
  });
 }
 const observer = new ResizeObserver(align);
 fixtures.forEach(fixture => observer.observe(fixture));
 window.addEventListener('load', align);
 document.fonts?.ready.then(align);
 align();
})();