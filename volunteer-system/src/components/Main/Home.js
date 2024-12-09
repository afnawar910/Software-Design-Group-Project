import React from 'react';
import '../../styles/Home.css';
import bannerImage from '../../images/AnimalShelter_Home_Banner.png';
import whoAreWeImage from '../../images/AnimalShelter_WhoAreWe.png';

const Home = () => {
    return (
        <div className="home-container">
            <div className="banner-container">
                <img src={bannerImage} alt="Adopt-a-Companion Banner" className="banner-image" />
            </div>
            <div className="who-are-we-container">
                <img src={whoAreWeImage} alt="Who Are We" className="who-are-we-image" />
            </div>
        </div>
    );
};

export default Home;