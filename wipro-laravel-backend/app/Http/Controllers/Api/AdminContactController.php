<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\QuoteRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminContactController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        // Subquery: latest request id per email (to get current name/phone)
        $latest = DB::table('quote_requests')
            ->select('investor_email', DB::raw('MAX(id) as latest_id'))
            ->whereNotNull('investor_email')
            ->where('investor_email', '!=', '')
            ->groupBy('investor_email');

        // Subquery: count and first contact date per email
        $counts = DB::table('quote_requests')
            ->select(
                'investor_email',
                DB::raw('COUNT(*) as requests_count'),
                DB::raw('MIN(created_at) as first_contact_at')
            )
            ->whereNotNull('investor_email')
            ->where('investor_email', '!=', '')
            ->groupBy('investor_email');

        $query = DB::table('quote_requests as qr')
            ->joinSub($latest, 'l', fn($j) => $j->on('qr.id', '=', 'l.latest_id'))
            ->joinSub($counts, 'c', fn($j) => $j->on('qr.investor_email', '=', 'c.investor_email'))
            ->select([
                'qr.investor_email as email',
                'qr.investor_name as name',
                'qr.investor_phone as phone',
                'qr.created_at as latest_request_at',
                'c.requests_count',
                'c.first_contact_at',
            ])
            ->orderByDesc('qr.created_at');

        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(function ($q) use ($s) {
                $q->where('qr.investor_email', 'like', "%{$s}%")
                  ->orWhere('qr.investor_name', 'like', "%{$s}%")
                  ->orWhere('qr.investor_phone', 'like', "%{$s}%");
            });
        }

        return response()->json($query->paginate(20));
    }

    public function requests(Request $request): JsonResponse
    {
        $data = $request->validate(['email' => 'required|string|max:255']);

        $requests = QuoteRequest::where('investor_email', $data['email'])
            ->select(['id', 'request_number', 'investor_name', 'investor_company', 'investment_name', 'status', 'created_at'])
            ->orderByDesc('created_at')
            ->get();

        return response()->json($requests);
    }
}
