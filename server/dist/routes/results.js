import { Router } from "express";
import { storage } from "../storage";
import { auditLogger, AuditLogger } from "../audit-logger";
const resultsRoutes = Router();
// Get comprehensive voting results
resultsRoutes.get("/", async (req, res) => {
    try {
        const results = await storage.getVoteResults();
        // Log results viewing
        auditLogger.log(AuditLogger.ACTIONS.RESULTS_VIEWED, { resultsCount: results.length }, undefined, undefined, req.ip, req.get('User-Agent'));
        // Group results by position
        const groupedResults = results.reduce((acc, result) => {
            if (!acc[result.position]) {
                acc[result.position] = [];
            }
            acc[result.position].push({
                candidateId: result.candidateId,
                candidateName: result.candidateName,
                voteCount: result.voteCount
            });
            return acc;
        }, {});
        // Calculate total votes per position and overall
        const totalVotesByPosition = Object.keys(groupedResults).reduce((acc, position) => {
            acc[position] = groupedResults[position].reduce((sum, candidate) => sum + candidate.voteCount, 0);
            return acc;
        }, {});
        const overallTotalVotes = Object.values(totalVotesByPosition).reduce((sum, votes) => sum + votes, 0);
        // Sort candidates within each position by vote count (descending)
        Object.keys(groupedResults).forEach(position => {
            groupedResults[position].sort((a, b) => b.voteCount - a.voteCount);
        });
        res.json({
            success: true,
            results: groupedResults,
            summary: {
                totalVotesByPosition,
                overallTotalVotes,
                positionsCount: Object.keys(groupedResults).length
            },
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        auditLogger.log(AuditLogger.ACTIONS.DATABASE_ERROR, { error: error instanceof Error ? error.message : 'Unknown error', endpoint: '/api/results' }, undefined, undefined, req.ip, req.get('User-Agent'));
        console.error('Error fetching results:', error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch results"
        });
    }
});
// Get results for a specific position
resultsRoutes.get("/position/:position", async (req, res) => {
    try {
        const { position } = req.params;
        const results = await storage.getVoteResults();
        // Filter results for the specific position
        const positionResults = results.filter(result => result.position.toLowerCase() === position.toLowerCase());
        if (positionResults.length === 0) {
            return res.json({
                success: true,
                position,
                results: [],
                message: "No votes found for this position"
            });
        }
        // Sort by vote count (descending)
        positionResults.sort((a, b) => b.voteCount - a.voteCount);
        const totalVotes = positionResults.reduce((sum, result) => sum + result.voteCount, 0);
        res.json({
            success: true,
            position,
            results: positionResults.map(result => ({
                candidateId: result.candidateId,
                candidateName: result.candidateName,
                voteCount: result.voteCount,
                percentage: totalVotes > 0 ? Math.round((result.voteCount / totalVotes) * 100 * 100) / 100 : 0
            })),
            summary: {
                totalVotes,
                candidatesCount: positionResults.length
            }
        });
    }
    catch (error) {
        console.error('Error fetching position results:', error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch results for position"
        });
    }
});
// Year-based voting results endpoints (if storage supports it)
resultsRoutes.get("/by-year/second-year", async (req, res) => {
    try {
        const mongoStorage = storage;
        if (!mongoStorage.getYearBasedResults) {
            return res.status(501).json({
                success: false,
                message: "Year-based voting results not supported with current storage configuration"
            });
        }
        const votes = await mongoStorage.getYearBasedResults('second');
        res.json({
            success: true,
            year: 'Second Year',
            votes: votes
        });
    }
    catch (error) {
        console.error('Error fetching second year votes:', error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch second year votes"
        });
    }
});
resultsRoutes.get("/by-year/third-year", async (req, res) => {
    try {
        const mongoStorage = storage;
        if (!mongoStorage.getYearBasedResults) {
            return res.status(501).json({
                success: false,
                message: "Year-based voting results not supported with current storage configuration"
            });
        }
        const votes = await mongoStorage.getYearBasedResults('third');
        res.json({
            success: true,
            year: 'Third Year',
            votes: votes
        });
    }
    catch (error) {
        console.error('Error fetching third year votes:', error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch third year votes"
        });
    }
});
resultsRoutes.get("/by-year/final-year", async (req, res) => {
    try {
        const mongoStorage = storage;
        if (!mongoStorage.getYearBasedResults) {
            return res.status(501).json({
                success: false,
                message: "Year-based voting results not supported with current storage configuration"
            });
        }
        const votes = await mongoStorage.getYearBasedResults('final');
        res.json({
            success: true,
            year: 'Final Year',
            votes: votes
        });
    }
    catch (error) {
        console.error('Error fetching final year votes:', error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch final year votes"
        });
    }
});
resultsRoutes.get("/by-year/all", async (req, res) => {
    try {
        const mongoStorage = storage;
        if (!mongoStorage.getYearBasedResults) {
            return res.status(501).json({
                success: false,
                message: "Year-based voting results not supported with current storage configuration"
            });
        }
        const [secondYear, thirdYear, finalYear] = await Promise.all([
            mongoStorage.getYearBasedResults('second'),
            mongoStorage.getYearBasedResults('third'),
            mongoStorage.getYearBasedResults('final')
        ]);
        res.json({
            success: true,
            data: {
                'Second Year': secondYear,
                'Third Year': thirdYear,
                'Final Year': finalYear
            },
            summary: {
                totalYears: 3,
                secondYearVotes: secondYear.length,
                thirdYearVotes: thirdYear.length,
                finalYearVotes: finalYear.length,
                overallTotal: secondYear.length + thirdYear.length + finalYear.length
            }
        });
    }
    catch (error) {
        console.error('Error fetching all year votes:', error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch all year votes"
        });
    }
});
// Get voting statistics
resultsRoutes.get("/stats", async (req, res) => {
    try {
        const results = await storage.getVoteResults();
        const totalStudents = await storage.countStudents();
        // Calculate total votes cast
        const totalVotes = results.reduce((sum, result) => sum + result.voteCount, 0);
        // Calculate voting turnout percentage
        const turnoutPercentage = totalStudents > 0 ? Math.round((totalVotes / totalStudents) * 100 * 100) / 100 : 0;
        // Get votes by position
        const votesByPosition = results.reduce((acc, result) => {
            if (!acc[result.position]) {
                acc[result.position] = 0;
            }
            acc[result.position] += result.voteCount;
            return acc;
        }, {});
        res.json({
            success: true,
            statistics: {
                totalStudents,
                totalVotes,
                turnoutPercentage,
                votesByPosition,
                positionsWithVotes: Object.keys(votesByPosition).length,
                averageVotesPerPosition: Object.keys(votesByPosition).length > 0
                    ? Math.round((totalVotes / Object.keys(votesByPosition).length) * 100) / 100
                    : 0
            },
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('Error fetching voting statistics:', error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch voting statistics"
        });
    }
});
export { resultsRoutes };
//# sourceMappingURL=results.js.map