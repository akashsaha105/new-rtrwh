import React from 'react';

const About = () => {
    return (
        <div id="about" className="flex flex-col items-center justify-center text-center min-h-32 gap-6 px-4">
            <h1 className="text-4xl md:text-6xl font-extrabold mb-6 bg-gradient-to-r from-[#48bb78] to-[#0077b6] bg-clip-text text-transparent">
                About Us
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            The idea is a simple, effective rooftop rainwater harvesting tool that reduces reliance on secondary water sources and addresses water scarcity.
          </p>

            <div className="w-[750] max-w-auto aspect-video">
                <iframe 
                    className="w-full h-full rounded-lg shadow-lg"
                    src="https://www.youtube.com/embed/I4V0QiyKAYs" 
                    title="YouTube video player" 
                    frameBorder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowFullScreen
                ></iframe>
            </div>
        </div>
    );
};

export default About;
