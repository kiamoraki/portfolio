document.addEventListener('DOMContentLoaded', (event) => {
    function createCloud() {
        const cloud = document.createElement('div');
        cloud.className = 'cloud';

        // Set random size for the cloud
        const size = 30 + Math.random() * 70; // Between 30px and 100px
        cloud.style.width = `${size}px`;
        cloud.style.height = `${size / 2}px`;

        // Set initial position for the cloud
        cloud.style.left = `-${size}px`; // Start just off the left side of the screen
        cloud.style.top = `${Math.random() * window.innerHeight}px`;

        // Set random animation duration for the cloud
        const duration = 15 + Math.random() * 15; // Between 15s and 30s
        cloud.style.animationDuration = `${duration}s`;

        document.body.appendChild(cloud);

        // Ensure the cloud regenerates when it goes off the right side of the screen
        cloud.addEventListener('animationend', () => {
            cloud.remove();
            createCloud();
        });
    }

});