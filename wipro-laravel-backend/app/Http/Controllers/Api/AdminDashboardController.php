<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Elevator;
use App\Models\QuoteRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminDashboardController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $adminId = null;

        if ($user->isSuperAdmin() && $request->filled('admin_id')) {
            $adminId = (int) $request->admin_id;
        } elseif (!$user->isSuperAdmin()) {
            $adminId = $user->id;
        }

        $baseQuery = fn() => $adminId
            ? QuoteRequest::where('assigned_admin_id', $adminId)
            : QuoteRequest::query();

        $totalRequests     = $baseQuery()->count();
        $pendingRequests   = $baseQuery()->where('status', 'new')->count();
        $processedRequests = $baseQuery()->whereIn('status', ['offer_sent', 'accepted'])->count();
        $totalClients      = User::where('role', 'client')->count();
        $totalElevators    = Elevator::where('is_active', true)->count();

        $requestsTimeline = $baseQuery()
            ->selectRaw('DATE(created_at) as date, COUNT(*) as count')
            ->where('created_at', '>=', now()->subDays(30))
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->map(fn($i) => ['date' => $i->date, 'count' => (int) $i->count]);

        $byStatus = $baseQuery()
            ->selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->get()
            ->map(fn($i) => ['status' => $i->status, 'count' => (int) $i->count]);

        $recentRequests = $baseQuery()
            ->with('user')
            ->orderByDesc('created_at')
            ->limit(5)
            ->get()
            ->map(fn($r) => [
                'id'             => $r->id,
                'request_number' => $r->request_number,
                'investor_name'  => $r->investor_name,
                'status'         => $r->status,
                'created_at'     => $r->created_at,
            ]);

        return response()->json([
            'tiles' => [
                'total_requests'     => $totalRequests,
                'pending_requests'   => $pendingRequests,
                'processed_requests' => $processedRequests,
                'total_clients'      => $totalClients,
                'total_elevators'    => $totalElevators,
            ],
            'requests_timeline' => $requestsTimeline,
            'by_status'         => $byStatus,
            'recent_requests'   => $recentRequests,
        ]);
    }
}
