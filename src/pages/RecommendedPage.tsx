
import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Recommended from '@/components/Recommended';

const RecommendedPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <Recommended />
      </main>
      <Footer />
    </div>
  );
};

export default RecommendedPage;
