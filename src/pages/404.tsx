import { CustomerLayout } from '@/components/layout/CustomerLayout';
import React from 'react';
import { Link } from '@/lib/routerCompat';
import { Home, Search } from 'lucide-react';
import { FadeIn } from '@/components/ui';
import Head from 'next/head';

export const NotFoundPage: React.FC = () => {
    return (
        <>
            <Head>
                <title>Page Not Found | Shiny Shades</title>
                <meta name="robots" content="noindex, nofollow" />
            </Head>
            <div className="min-h-screen pt-24 pb-16 flex items-center justify-center px-4">
                <FadeIn>
                    <div className="text-center max-w-md mx-auto">
                        {/* Big 404 */}
                        <h1 className="heading-serif text-7xl md:text-8xl font-bold text-rose-gold mb-2">
                            404
                        </h1>

                        <h2 className="heading-serif text-2xl md:text-3xl font-bold text-charcoal mb-3">
                            Page Not Found
                        </h2>

                        <p className="text-[#6B5B55] leading-relaxed mb-8">
                            Sorry, we couldn&apos;t find the page you&apos;re looking for. It might have
                            been moved, renamed, or doesn&apos;t exist.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            {/* Link styled as a button — a <button> inside an
                                anchor is invalid interactive nesting. */}
                            <Link
                                to="/"
                                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl font-semibold bg-rose-gold text-white hover:opacity-90 transition-opacity w-full sm:w-auto"
                            >
                                <Home size={17} />
                                Back to Home
                            </Link>
                            <Link
                                to="/shop"
                                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl font-semibold border-2 border-rose-gold text-rose-gold hover:bg-rose-50 transition-colors w-full sm:w-auto"
                            >
                                <Search size={17} />
                                Browse Shop
                            </Link>
                        </div>
                    </div>
                </FadeIn>
            </div>
        </>
    );
};

const getLayout = (page: React.ReactElement) => (
    <CustomerLayout>{page}</CustomerLayout>
);

(NotFoundPage as typeof NotFoundPage & { getLayout?: typeof getLayout }).getLayout = getLayout;

export default NotFoundPage;
