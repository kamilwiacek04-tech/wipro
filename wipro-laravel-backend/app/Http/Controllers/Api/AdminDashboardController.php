<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Elevator;
use App\Models\QuoteRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;

class AdminDashboardController extends Controller
{
    public function index(): JsonResponse
    {
        $totalRequests = QuoteRequest::count();
        $pendingRequests = QuoteRequest::where('status', 'new')->count();
        $processedRequests = QuoteRequest::whereIn('status', ['offer_sent', 'accepted'])->count();
        $totalClients = User::where('role', 'client')->count();
        $totalElevators = Elevator::where('is_active', true)->count();

        // Requests timeline (last 30 days)
        $requestsTimeline = QuoteRequest::selectRaw('DATE(created_at) as date, COUNT(*) as count')
            ->where('created_at', '>=', now()->subDays(30))
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->map(fn($item) => ['date' => $item->date, 'count' => (int) $item->count]);

        // Requests by status
        $byStatus = QuoteRequest::selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->get()
            ->map(fn($item) => ['status' => $item->status, 'count' => (int) $item->count]);

        // Recent requests
        $recentRequests = QuoteRequest::with('user')
            ->orderByDesc('created_at')
            ->limit(5)
            ->get()
            ->map(fn($r) => [
                'id' => $r->id,
                'request_number' => $r->request_number,
                'investor_name' => $r->investor_name,
                'status' => $r->status,
                'created_at' => $r->created_at,
            ]);

        return response()->json([
            'tiles' => [
                'total_requests' => $totalRequests,
                'pending_requests' => $pendingRequests,
                'processed_requests' => $processedRequests,
                'total_clients' => $totalClients,
                'total_elevators' => $totalElevators,
            ],
            'requests_timeline' => $requestsTimeline,
            'by_status' => $byStatus,
            'recent_requests' => $recentRequests,
        ]);
    }
}
