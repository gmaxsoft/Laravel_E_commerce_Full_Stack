<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ValidateCouponRequest extends FormRequest
{
    /**
     * Określa czy użytkownik jest uprawniony do wykonania żądania.
     */
    public function authorize(): bool
    {
        return true; // Pozwól każdemu zweryfikować kupon
    }

    /**
     * Pobiera reguły walidacji dla żądania.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'code' => 'required|string|exists:coupons,code',
            'amount' => 'nullable|numeric|min:0',
        ];
    }

    /**
     * Pobiera niestandardowe komunikaty błędów walidacji.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'code.required' => 'Kod kuponu jest wymagany',
            'code.exists' => 'Kupon o podanym kodzie nie istnieje',
            'amount.numeric' => 'Kwota musi być liczbą',
            'amount.min' => 'Kwota nie może być ujemna',
        ];
    }
}
