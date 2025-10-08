import React from 'react';
import GlowEffect from '@/components/ui/GlowEffect';
import { cn } from '@/lib/utils';

/**
 * Example usage of the GlowEffect component
 * This demonstrates various configurations and use cases
 */
const GlowEffectExample: React.FC = () => {
  return (
    <div className="p-8 space-y-8 bg-gray-900 min-h-screen">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-white mb-4">
          GlowEffect Component Examples
        </h1>
        <p className="text-gray-300">
          Hover over the cards below to see the magical glow effects in action!
        </p>
      </div>

      {/* Basic Glow Effect */}
      <div className="glow-section">
        <h2 className="text-2xl font-semibold text-white mb-6">Basic Glow Effect</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <GlowEffect
            glowColor="132, 0, 255"
            enableBorderGlow={true}
            enableSpotlight={false}
            enableParticles={false}
            className="p-6 rounded-xl bg-gray-800 border border-gray-700"
          >
            <div className="text-center">
              <h3 className="text-xl font-semibold text-white mb-2">Basic Glow</h3>
              <p className="text-gray-300">
                Simple border glow effect that follows your mouse
              </p>
            </div>
          </GlowEffect>

          <GlowEffect
            glowColor="59, 130, 246"
            enableBorderGlow={true}
            enableSpotlight={false}
            enableParticles={false}
            className="p-6 rounded-xl bg-gray-800 border border-gray-700"
          >
            <div className="text-center">
              <h3 className="text-xl font-semibold text-white mb-2">Blue Glow</h3>
              <p className="text-gray-300">
                Same effect with a blue color scheme
              </p>
            </div>
          </GlowEffect>

          <GlowEffect
            glowColor="20, 184, 166"
            enableBorderGlow={true}
            enableSpotlight={false}
            enableParticles={false}
            className="p-6 rounded-xl bg-gray-800 border border-gray-700"
          >
            <div className="text-center">
              <h3 className="text-xl font-semibold text-white mb-2">Teal Glow</h3>
              <p className="text-gray-300">
                Teal colored glow effect
              </p>
            </div>
          </GlowEffect>
        </div>
      </div>

      {/* Full Featured Glow Effect */}
      <div className="glow-section">
        <h2 className="text-2xl font-semibold text-white mb-6">Full Featured Magic</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <GlowEffect
            glowColor="132, 0, 255"
            enableBorderGlow={true}
            enableSpotlight={true}
            enableParticles={true}
            enableTilt={true}
            enableMagnetism={true}
            clickEffect={true}
            particleCount={8}
            spotlightRadius={250}
            className="p-8 rounded-xl bg-gradient-to-br from-purple-900 to-blue-900 border border-purple-500"
          >
            <div className="text-center">
              <h3 className="text-2xl font-bold text-white mb-4">Magic Card</h3>
              <p className="text-gray-200 mb-4">
                This card has all effects enabled: border glow, spotlight, particles, tilt, magnetism, and click effects!
              </p>
              <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors">
                Click me!
              </button>
            </div>
          </GlowEffect>

          <GlowEffect
            glowColor="236, 72, 153"
            enableBorderGlow={true}
            enableSpotlight={true}
            enableParticles={true}
            enableTilt={false}
            enableMagnetism={false}
            clickEffect={true}
            particleCount={6}
            spotlightRadius={200}
            className="p-8 rounded-xl bg-gradient-to-br from-pink-900 to-rose-900 border border-pink-500"
          >
            <div className="text-center">
              <h3 className="text-2xl font-bold text-white mb-4">Pink Magic</h3>
              <p className="text-gray-200 mb-4">
                Pink themed magic with spotlight and particles, but no tilt or magnetism
              </p>
              <div className="flex justify-center space-x-2">
                <div className="w-3 h-3 bg-pink-400 rounded-full animate-pulse"></div>
                <div className="w-3 h-3 bg-pink-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-3 h-3 bg-pink-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          </GlowEffect>
        </div>
      </div>

      {/* Different Card Styles */}
      <div className="glow-section">
        <h2 className="text-2xl font-semibold text-white mb-6">Different Styles</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <GlowEffect
            glowColor="34, 197, 94"
            enableBorderGlow={true}
            enableSpotlight={false}
            enableParticles={true}
            particleCount={4}
            className="p-6 rounded-2xl bg-gradient-to-br from-green-800 to-emerald-800 border border-green-500"
          >
            <div className="text-center">
              <div className="text-4xl mb-3">🌱</div>
              <h3 className="text-lg font-semibold text-white">Growth</h3>
              <p className="text-green-200 text-sm">Nature inspired</p>
            </div>
          </GlowEffect>

          <GlowEffect
            glowColor="245, 158, 11"
            enableBorderGlow={true}
            enableSpotlight={false}
            enableParticles={true}
            particleCount={6}
            className="p-6 rounded-full bg-gradient-to-br from-orange-800 to-yellow-800 border border-orange-500"
          >
            <div className="text-center">
              <div className="text-4xl mb-3">⚡</div>
              <h3 className="text-lg font-semibold text-white">Energy</h3>
              <p className="text-orange-200 text-sm">Dynamic power</p>
            </div>
          </GlowEffect>

          <GlowEffect
            glowColor="99, 102, 241"
            enableBorderGlow={true}
            enableSpotlight={false}
            enableParticles={true}
            particleCount={5}
            className="p-6 rounded-lg bg-gradient-to-br from-indigo-800 to-purple-800 border border-indigo-500"
          >
            <div className="text-center">
              <div className="text-4xl mb-3">🚀</div>
              <h3 className="text-lg font-semibold text-white">Innovation</h3>
              <p className="text-indigo-200 text-sm">Future forward</p>
            </div>
          </GlowEffect>
        </div>
      </div>

      {/* Large Feature Card */}
      <div className="glow-section">
        <h2 className="text-2xl font-semibold text-white mb-6">Large Feature Card</h2>
        <GlowEffect
          glowColor="139, 69, 19"
          enableBorderGlow={true}
          enableSpotlight={true}
          enableParticles={true}
          enableTilt={true}
          clickEffect={true}
          particleCount={12}
          spotlightRadius={400}
          className="p-12 rounded-3xl bg-gradient-to-br from-amber-900 via-orange-900 to-red-900 border border-amber-500"
        >
          <div className="text-center max-w-2xl mx-auto">
            <h3 className="text-4xl font-bold text-white mb-6">Premium Experience</h3>
            <p className="text-xl text-gray-200 mb-8">
              This large card demonstrates how the glow effect scales beautifully across different sizes.
              The spotlight effect creates an immersive experience as you move your mouse around.
            </p>
            <div className="flex justify-center space-x-4">
              <button className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors font-semibold">
                Get Started
              </button>
              <button className="px-6 py-3 border border-amber-500 text-amber-300 hover:bg-amber-500 hover:text-white rounded-lg transition-colors font-semibold">
                Learn More
              </button>
            </div>
          </div>
        </GlowEffect>
      </div>

      {/* Usage Instructions */}
      <div className="mt-16 p-8 bg-gray-800 rounded-xl border border-gray-700">
        <h3 className="text-2xl font-semibold text-white mb-4">Usage Instructions</h3>
        <div className="text-gray-300 space-y-4">
          <p>
            <strong className="text-white">Border Glow:</strong> Creates a glowing border that follows your mouse position
          </p>
          <p>
            <strong className="text-white">Spotlight:</strong> Adds a large spotlight effect that tracks mouse movement
          </p>
          <p>
            <strong className="text-white">Particles:</strong> Generates animated particles on hover
          </p>
          <p>
            <strong className="text-white">Tilt:</strong> Adds 3D tilt effect based on mouse position
          </p>
          <p>
            <strong className="text-white">Magnetism:</strong> Elements slightly follow mouse movement
          </p>
          <p>
            <strong className="text-white">Click Effect:</strong> Creates a ripple effect when clicked
          </p>
        </div>
      </div>
    </div>
  );
};

export default GlowEffectExample;
