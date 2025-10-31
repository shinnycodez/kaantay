import Header from './components/Header';
import HeroBanner from './components/HeroBanner';
import FeaturedCategories from './components/FeaturedCategories';
import ShopTheLook from './components/ShopTheLook';
import Footer from './components/Footer';
import ContactForm from './components/ContactForm';

function Home() {
  return (
    <div
      className="relative flex size-full min-h-screen flex-col bg-[#bfaedb] group/design-root overflow-x-hidden"
      style={{ fontFamily: '"Noto Serif", "Noto Sans", sans-serif' }}
    >
      {/* Notice Bar */}
      <div className="w-full bg-[#301934] text-white text-center py-2 font-semibold text-sm md:text-base">
        Minimum order should be of Rs. 500 — Orders less than Rs. 500 will not be delivered.
      </div>

      <div className="layout-container flex h-full grow flex-col">
        <Header />
        <div className="px-4 md:px-10 lg:px-40 flex flex-1 justify-center py-5">
          <div className="layout-content-container flex flex-col max-w-[960px] flex-1 w-full">
            <HeroBanner />
            <FeaturedCategories />
            <ShopTheLook />
            <div>
              <div className="mt-10 text-center">
                <p className="text-lg font-semibold text-gray-800">
                  Or contact us directly on WhatsApp:
                </p>
                <a
                  href="https://wa.link/cr321u"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-600 font-bold underline hover:text-green-700"
                >
                  03229855832
                </a>
              </div>
              <ContactForm />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
