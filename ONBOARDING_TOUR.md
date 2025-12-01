# Onboarding Tour - SkinMatch AI

## Overview
Fitur Onboarding Tour dirancang untuk memperkenalkan fitur-fitur utama SkinMatch AI kepada pengguna baru dengan cara yang interaktif dan menarik.

## Fitur Utama

### 🎯 7 Step Interactive Tour
Tour terdiri dari 7 langkah yang menjelaskan:
1. **Welcome** - Pengenalan SkinMatch AI
2. **AI Skin Scan** - Analisis kulit dengan kamera
3. **Product Scan** - Scan ingredients produk
4. **AI Chat** - Konsultasi dengan AI assistant
5. **Routine Tracker** - Kelola routine skincare
6. **Progress Tracking** - Before/after comparison
7. **Product Marketplace** - Browse produk skincare

### ✨ User Experience
- **Auto-show**: Muncul otomatis untuk pengguna baru setelah 1 detik
- **Progress indicator**: Progress bar dan dots navigation
- **Skip option**: Bisa dilewati kapan saja
- **Mobile-friendly**: Responsive untuk semua device
- **Animations**: Smooth fade-in animations per step
- **Visual appeal**: Gradient backgrounds per fitur

### 🔄 Restart Tour
Pengguna bisa memulai tour lagi dari:
- **Account Settings** → App Preferences → "Mulai Tour Lagi"
- Tour akan clear localStorage dan reload page

## Implementation Details

### Files Created
- `src/components/OnboardingTour.tsx` - Main tour component
- `src/components/OnboardingTour.tsx` - Hook: `useRestartTour()`

### Integration Points
- **Dashboard.tsx** - Tour muncul saat pertama buka dashboard
- **AccountSettings.tsx** - Button untuk restart tour

### LocalStorage Keys
- `has-seen-onboarding` - Boolean flag untuk tracking apakah user sudah lihat tour

## Technical Features
- Uses Radix UI Dialog for modal
- Smooth animations with Tailwind CSS
- Step-by-step navigation with progress tracking
- Mobile dropdown selector for easier navigation on small screens
- Desktop visual timeline with clickable dots
- Feature list with checkmark icons per step
- Gradient backgrounds matching each feature's theme

## Future Enhancements
- [ ] Add analytics tracking for tour completion
- [ ] A/B test different tour flows
- [ ] Add video demos for each feature
- [ ] Interactive hotspots on actual UI elements
- [ ] Personalized tour based on user's skin concerns
