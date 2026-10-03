import React, { useState } from 'react';

const CameraComponent: React.FC = () => {
    const [cameraOn, setCameraOn] = useState(false);

    const toggleCamera = () => {
        setCameraOn(prevState => !prevState);
        // You would implement actual camera on/off logic here
    };

    return (
        <div>
            <button onClick={toggleCamera}>
                {cameraOn ? 'Turn Camera Off' : 'Turn Camera On'}
            </button>
            {cameraOn && (
                <img
                    src="http://localhost:5000/video_feed" // Assuming Flask is running on localhost:5000
                    alt="Video Feed"
                />
            )}
        </div>
    );
};

export default CameraComponent;
