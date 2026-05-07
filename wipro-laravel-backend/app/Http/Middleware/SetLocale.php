<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Symfony\Component\HttpFoundation\Response;

class SetLocale
{
    public function handle(Request $request, Closure $next): Response
    {
        $lang = strtolower($request->header('X-Lang', 'pl'));

        App::setLocale(in_array($lang, ['pl', 'en']) ? $lang : 'pl');

        return $next($request);
    }
}
