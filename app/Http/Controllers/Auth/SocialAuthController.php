<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Laravel\Socialite\Facades\Socialite;

class SocialAuthController extends Controller
{
    public function redirectToGoogle(): RedirectResponse
    {
        return Socialite::driver('google')->redirect();
    }

    public function handleGoogleCallback(): JsonResponse|RedirectResponse
    {
        try {
            $googleUser = Socialite::driver('google')->user();

            // Sprawdź czy użytkownik już istnieje
            $user = User::where('email', $googleUser->getEmail())->first();

            if (! $user) {
                // Utwórz nowego użytkownika
                $user = User::create([
                    'name' => $googleUser->getName(),
                    'email' => $googleUser->getEmail(),
                    'provider' => 'google',
                    'provider_id' => $googleUser->getId(),
                    'avatar' => $googleUser->getAvatar(),
                    'email_verified_at' => now(), // Google zweryfikował email
                    'password' => null, // Brak hasła dla social login
                ]);
            } else {
                // Aktualizuj dane użytkownika jeśli używa Google
                if ($user->provider !== 'google') {
                    $user->update([
                        'provider' => 'google',
                        'provider_id' => $googleUser->getId(),
                        'avatar' => $googleUser->getAvatar() ?? $user->avatar,
                    ]);
                }
            }

            // Token Sanctum dla SPA – callback to zawsze redirect (brak sesji w API)
            $token = $user->createToken('auth-token')->plainTextToken;
            $frontendUrl = config('app.frontend_url', 'http://localhost:5173');

            // Przekieruj na frontend z tokenem w URL – frontend odczyta i zapisze go
            return redirect(rtrim($frontendUrl, '/').'/login?token='.urlencode($token));
        } catch (\Exception $e) {
            \Log::error('Google OAuth error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            $frontendUrl = config('app.frontend_url', 'http://localhost:5173');

            return redirect(rtrim($frontendUrl, '/').'/login?error=auth_failed');
        }
    }
}
