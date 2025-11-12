import React, { useRef, useEffect } from 'react';
import './ClickSpark.css'; // Import the correct CSS

// Helper function
function easeOut(t) {
    return t * (2 - t);
}

const ClickSpark = () => {
    const canvasRef = useRef(null);
    const sparksRef = useRef([]);
    const animationFrameRef = useRef(null);

    // This function adds new sparks to our ref array
    const createSparks = (x, y, options = {}) => {
        const {
            sparkColor = "#ffcc00", // Default color
            sparkCount = 10,
            sparkSize = 12,
            sparkRadius = 25,
            duration = 500,
        } = options;

        const now = performance.now();
        for (let i = 0; i < sparkCount; i++) {
            const angle = (2 * Math.PI * i) / sparkCount;
            sparksRef.current.push({
                x, y, angle, startTime: now, duration,
                sparkColor, sparkSize, sparkRadius,
            });
        }
    };

    // This useEffect runs only once when the component mounts
    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        let width, height;

        // Resize handler
        function resizeCanvas() {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;
        }
        window.addEventListener("resize", resizeCanvas);
        resizeCanvas();

        // Click handler that triggers sparks
        const handleClick = (e) => {
            createSparks(e.clientX, e.clientY);
        };
        // Attach click listener to the *entire window*
        window.addEventListener("click", handleClick);

        // The animation loop
        function draw(timestamp) {
            ctx.clearRect(0, 0, width, height);

            sparksRef.current = sparksRef.current.filter((spark) => {
                const elapsed = timestamp - spark.startTime;
                if (elapsed >= spark.duration) return false;

                const progress = elapsed / spark.duration;
                const eased = easeOut(progress);
                const distance = eased * spark.sparkRadius;
                const lineLength = spark.sparkSize * (1 - eased);

                const x1 = spark.x + distance * Math.cos(spark.angle);
                const y1 = spark.y + distance * Math.sin(spark.angle);
                const x2 = spark.x + (distance + lineLength) * Math.cos(spark.angle);
                const y2 = spark.y + (distance + lineLength) * Math.sin(spark.angle);

                ctx.strokeStyle = spark.sparkColor;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();

                return true;
            });

            animationFrameRef.current = requestAnimationFrame(draw);
        }

        animationFrameRef.current = requestAnimationFrame(draw);

        // Cleanup function
        return () => {
            window.removeEventListener("resize", resizeCanvas);
            window.removeEventListener("click", handleClick); // Clean up click listener
            cancelAnimationFrame(animationFrameRef.current);
        };
    }, []); // Empty array ensures this runs only once

    // This component only renders the canvas, nothing else.
    return <canvas ref={canvasRef} />;
};

export default ClickSpark;
