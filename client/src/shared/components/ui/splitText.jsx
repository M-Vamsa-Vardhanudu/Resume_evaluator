import React, { useEffect, useRef } from 'react';
import './splitText.css'; 

/**
 * A React component that splits text and animates it on scroll.
 * * @param {string} text - The text you want to animate.
 * @param {string} [as='span'] - The HTML tag to use (e.g., 'h1', 'p').
 * @param {string} [type='chars'] - The split type ('chars' or 'words').
 */
const SplitText = ({ as: Tag = 'span', text, type = 'chars' }) => {
    // 2. Create a ref to get direct access to the HTML element
    const elRef = useRef(null);

    // 3. Run the animation logic when the component mounts
    useEffect(() => {
        const element = elRef.current;
        if (!element) return;

        // --- Logic from your <script> tag ---

        // 1. Split Text Logic: We use the 'text' prop
        element.textContent = ""; // Clear
        if (type === "words") {
            const words = text.split(" ");
            words.forEach((word, i) => {
                const span = document.createElement("span");
                span.textContent = word + (i !== words.length - 1 ? " " : "");
                element.appendChild(span);
            });
        } else {
            // Default: split into characters
            text.split("").forEach(char => {
                const span = document.createElement("span");
                span.textContent = char === " " ? "\u00A0" : char;
                element.appendChild(span);
            });
        }

        // 2. IntersectionObserver Logic
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const targetElement = entry.target;
                        targetElement.classList.add("visible");

                        const spans = targetElement.querySelectorAll("span");
                        spans.forEach((span, i) => {
                            span.style.transitionDelay = `${i * 0.05}s`;
                        });

                        observer.unobserve(targetElement); // run only once
                    }
                });
            },
            { threshold: 0.2 }
        );

        observer.observe(element);

        // 3. Cleanup function to run when the component unmounts
        return () => {
            observer.disconnect();
        };

    }, [text, type]); // Re-run the effect if the text or type changes

    // 4. Render the component
    // It will be empty at first, and the useEffect will fill it with <span>s
    return <Tag ref={elRef} className="split-text" />;
};

export default SplitText;
