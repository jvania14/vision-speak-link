import { useEffect, useRef } from "react";
import lottie from "lottie-web";
import animationData from "./fan.json"; // Update with your actual path

const FanAnimation = ({isOn}:any) => {
    const lottieRef = useRef<HTMLDivElement>(null); // Reference to the animation container
    const animRef = useRef<any | null>(null); // Define animRef as AnimationItem or null
  
    useEffect(() => {
      // Initialize the Lottie animation
      if (lottieRef.current) {
        animRef.current = lottie.loadAnimation({
          container: lottieRef.current,
          renderer: "svg",
          loop: false, // Loop will be controlled manually
          autoplay: false, // Do not autoplay
          animationData: animationData, // Lottie animation data
        });
      }
  
      return () => {
        if (animRef.current) animRef.current.destroy(); // Cleanup on unmount
      };
    }, []);
  
    useEffect(() => {
        const anim = animRef.current;
    
        if (anim) {
          if (isOn) {
            // Start looping between frames 0 and 24
            anim.playSegments([0, 91], true);
    
            // Ensure the event listener is added only once to prevent infinite loop
            const handleComplete = () => {
              if (isOn) {
                anim.goToAndPlay(0); // Restart the loop from frame 0 if still on
              }
            };
    
            anim.addEventListener("complete", handleComplete);
    
            // Clean up the event listener when 'isOn' changes to false
            return () => {
              anim.removeEventListener("complete", handleComplete);
            };
          } else {
            // Play from the current frame to frame 24 and stop smoothly
            const currentFrame = anim.currentFrame;
            anim.playSegments([currentFrame, 91], false);
          }
        }
      }, [isOn]);
    

  return (

      <div ref={lottieRef} className={`absolute bottom-0 ${(isOn) ? "drop-shadow" : ""}`}/>

  );
};

export default FanAnimation;
