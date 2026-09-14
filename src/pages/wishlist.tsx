/* ===================================================
   Wishlist Page — saved products from useWishlistStore
   The store already existed (persisted product IDs); this
   page just renders them. Navbar/Footer always linked here.
   =================================================== */
import { CustomerLayout } from '@/components/layout/CustomerLayout';
import React from 'react';
import { m as motion } from 'framer-motion';
import { Heart, ShoppingBag } from 'lucide-react';
import Head from 'next/head';
import { Button, EmptyState, PriceDisplay } from '@/components/ui';
import { ProductCard } from '@/components/home';
import { useNavigate, Link } from '@/lib/routerCompat';
import { useProductStore, usePrerenderedProducts } from '@/store/productStore';
import { useWishlistStore } from '@/store/uiStore';
import type { PageInitialData } from '@/types/layout';

export const WishlistPage: React.FC<PageInitialData> = ({ initialProducts }) => {
  const navigate = useNavigate();
  const { products } = usePrerenderedProducts(initialProducts);
  const fetchProducts = useProductStore((s) => s.fetchProducts);
  const wishlistIds = useWishlistStore((s) => s.wishlistIds);

  React.useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const wishlisted = products.filter((p) => wishlistIds.includes(p.id));

  return (
    <>
      <Head>
        <title>Your Wishlist | Shiny Shades</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <div className="min-h-screen pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-2">
            <Heart size={26} className="text-rose-gold" />
            <h1 className="heading-serif text-3xl md:text-4xl font-bold text-charcoal">
              Wishlist
            </h1>
          </div>
          <p className="text-[#6B5B55] mb-8">
            {wishlisted.length} {wishlisted.length === 1 ? 'item' : 'items'} saved
          </p>

          {wishlisted.length === 0 ? (
            <EmptyState
              icon={<Heart size={48} />}
              title="Nothing saved yet"
              description="Tap the heart on any product to save it here for later."
              action={
                <Button onClick={() => navigate('/shop')}>
                  <ShoppingBag size={16} /> Browse Shop
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
              {wishlisted.map((product, i) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <ProductCard product={product} priority={i < 4} />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

WishlistPage.getLayout = function getLayout(page: React.ReactElement) {
  return <CustomerLayout>{page}</CustomerLayout>;
};

export default WishlistPage;
