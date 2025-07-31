import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApiRequest } from '../lib/admin-api';

import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useToast } from '../hooks/use-toast';

// Student type
interface Student {
  id: string;
  urn: string;
  motherName: string;
  year: string;
  hasVoted: boolean;
  votedAt?: string;
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('students');
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [adminKey, setAdminKey] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [yearFilter, setYearFilter] = useState('all');
  const [searchUrn, setSearchUrn] = useState('');
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // New student form state
  const [newStudent, setNewStudent] = useState({
    urn: '',
    name: '',
    motherName: '',
    year: 'final-year'
  });
  
  // Bulk student import state
  const [bulkCsvContent, setBulkCsvContent] = useState('');
  const [parsedStudents, setParsedStudents] = useState<any[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  
  // Authenticate admin
  const handleAuthenticate = async () => {
    if (!adminKey.trim()) {
      toast({
        title: "Error",
        description: "Please enter the admin key",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    try {
      // Use adminApiRequest for consistency
      const response = await adminApiRequest<{ success: boolean, message: string }>(
        'GET',
        '/api/admin/verify',
        null,
        adminKey
      );
      
      if (response.success) {
        setIsAuthenticated(true);
        toast({
          title: "Success",
          description: "Successfully authenticated as admin"
        });
      } else {
        toast({
          title: "Error",
          description: response.message || "Invalid admin key",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Authentication error:", error);
      toast({
        title: "Error",
        description: "Failed to authenticate. Check that the API server is running correctly.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch students with pagination
  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      const response = await adminApiRequest<{
        success: boolean;
        students: Student[];
        totalPages: number;
      }>(
        'GET',
        `/api/admin/students?page=${currentPage}&year=${yearFilter}`,
        null,
        adminKey
      );
      
      if (response.success) {
        setStudents(response.students);
        setFilteredStudents(response.students);
        setTotalPages(response.totalPages || 1);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch students",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error fetching students:", error);
      toast({
        title: "Error",
        description: "Failed to fetch students",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  // Handle search by URN
  const handleSearch = () => {
    if (!searchUrn.trim()) {
      setFilteredStudents(students);
      return;
    }
    
    const filtered = students.filter(student => 
      student.urn.toLowerCase().includes(searchUrn.toLowerCase())
    );
    setFilteredStudents(filtered);
  };
  
  // Clear search
  const clearSearch = () => {
    setSearchUrn('');
    setFilteredStudents(students);
  };
  
  useEffect(() => {
    if (isAuthenticated) {
      fetchStudents();
    }
  }, [currentPage, yearFilter, isAuthenticated]);
  
  // Handle new student form change
  const handleNewStudentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewStudent(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle year selection change
  const handleYearChange = (value: string) => {
    setNewStudent(prev => ({ ...prev, year: value }));
  };
  
  // Handle year filter change
  const handleYearFilterChange = (value: string) => {
    setYearFilter(value);
    setCurrentPage(1);
  };
  
  // Define response type for add student
  interface ApiResponse {
    success: boolean;
    message?: string;
    student?: Student;
  }
  
  // Add a new student
  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newStudent.urn || !newStudent.motherName || !newStudent.name) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await adminApiRequest<ApiResponse>(
        'POST',
        '/api/admin/students',
        newStudent,
        adminKey
      );
      
      if (response.success) {
        toast({
          title: "Success",
          description: "Student added successfully"
        });
        
        // Reset form and switch to students tab
        setNewStudent({
          urn: '',
          name: '',
          motherName: '',
          year: 'final-year'
        });
        
        // Refresh the data and switch tabs
        await fetchStudents();
        setActiveTab('students');
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to add student",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error adding student:", error);
      toast({
        title: "Error",
        description: "Failed to add student",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Delete student
  const handleDeleteStudent = async (id: string) => {
    if (!confirm("Are you sure you want to delete this student?")) return;
    
    setIsLoading(true);
    try {
      const response = await adminApiRequest<ApiResponse>(
        'DELETE', 
        `/api/admin/students/${id}`,
        null,
        adminKey
      );
      
      if (response.success) {
        toast({
          title: "Success",
          description: "Student deleted successfully"
        });
        fetchStudents();
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to delete student",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error deleting student:", error);
      toast({
        title: "Error",
        description: "Failed to delete student",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Parse CSV content
  const parseCsvContent = () => {
    if (!bulkCsvContent.trim()) {
      toast({
        title: "Error",
        description: "CSV content is empty",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const lines = bulkCsvContent.trim().split('\n');
      
      // Validate header row
      const headerRow = lines[0].split(',');
      if (!headerRow.includes('URN') || !headerRow.includes("Mother's Name")) {
        toast({
          title: "Error",
          description: "CSV must have URN and Mother's Name columns",
          variant: "destructive"
        });
        return;
      }
      
      const urnIndex = headerRow.indexOf('URN');
      const nameIndex = headerRow.indexOf('Name');
      const motherNameIndex = headerRow.indexOf("Mother's Name");
      
      if (nameIndex === -1) {
        toast({
          title: "Warning",
          description: "Name column not found. Will use URN as name."
        });
      }
      
      const parsedData = lines.slice(1).map(line => {
        const columns = line.split(',');
        const urn = columns[urnIndex]?.trim();
        const name = nameIndex !== -1 ? columns[nameIndex]?.trim() : urn;
        const motherName = columns[motherNameIndex]?.trim();
        
        return {
          urn,
          name,
          motherName,
          year: newStudent.year // Use the selected year from the dropdown
        };
      }).filter(student => student.urn && student.motherName);
      
      setParsedStudents(parsedData);
      setShowPreview(true);
    } catch (error) {
      console.error("Error parsing CSV:", error);
      toast({
        title: "Error",
        description: "Failed to parse CSV content",
        variant: "destructive"
      });
    }
  };
  
  // Define bulk import response
  interface BulkImportResponse extends ApiResponse {
    results?: {
      success: number;
      failed: number;
      errors?: string[];
    }
  }
  
  // Bulk import students
  const handleBulkImport = async () => {
    if (parsedStudents.length === 0) {
      toast({
        title: "Error",
        description: "No valid students to import",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await adminApiRequest<BulkImportResponse>(
        'POST',
        '/api/admin/students/bulk',
        { students: parsedStudents },
        adminKey
      );
      
      if (response.success) {
        toast({
          title: "Success",
          description: `Successfully imported ${response.results?.success} students. Failed: ${response.results?.failed}`
        });
        
        // Reset form and switch to students tab
        setBulkCsvContent('');
        setParsedStudents([]);
        setShowPreview(false);
        setActiveTab('students');
        fetchStudents();
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to import students",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error importing students:", error);
      toast({
        title: "Error",
        description: "Failed to import students",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="container max-w-4xl mx-auto p-4 pb-20">
      <h1 className="text-2xl font-bold text-center text-aisa-navy mb-6">AISA Election Admin</h1>
      
      {!isAuthenticated ? (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Admin Authentication</h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="adminKey">Admin Key</Label>
              <Input 
                type="password" 
                id="adminKey"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                placeholder="Enter admin key"
              />
            </div>
            <Button 
              onClick={handleAuthenticate} 
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "Authenticating..." : "Log In"}
            </Button>
          </div>
        </Card>
      ) : (
        <>
          <div className="mb-6 flex justify-between items-center">
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate('/')}>
                Back to Home
              </Button>
              <Button 
                variant="outline" 
                onClick={() => window.open('/results', '_blank')}
                className="bg-green-100 hover:bg-green-200 text-green-800"
              >
                View Live Results
              </Button>
            </div>
            <Button variant="destructive" onClick={() => setIsAuthenticated(false)}>
              Logout
            </Button>
          </div>
          
          <Tabs defaultValue="students" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="students">Manage Students</TabsTrigger>
              <TabsTrigger value="addStudent">Add Student</TabsTrigger>
              <TabsTrigger value="bulkImport">Bulk Import</TabsTrigger>
              <TabsTrigger value="liveResults">Live Results</TabsTrigger>
            </TabsList>
            
            <TabsContent value="students">
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Student List</h2>
                
                {/* Search Feature */}
                <div className="mb-4 flex gap-2">
                  <div className="flex-1">
                    <Label htmlFor="searchUrn">Search by URN</Label>
                    <div className="flex gap-2">
                      <Input 
                        id="searchUrn"
                        value={searchUrn}
                        onChange={(e) => setSearchUrn(e.target.value)}
                        placeholder="Enter student URN"
                        className="flex-1"
                      />
                      <Button onClick={handleSearch}>Search</Button>
                      {searchUrn && (
                        <Button variant="outline" onClick={clearSearch}>Clear</Button>
                      )}
                    </div>
                  </div>

                  <div className="w-[200px]">
                    <Label htmlFor="yearFilter">Filter by Year</Label>
                    <Select value={yearFilter} onValueChange={handleYearFilterChange}>
                      <SelectTrigger id="yearFilter" className="w-full">
                        <SelectValue placeholder="All Years" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Years</SelectItem>
                        <SelectItem value="second-year">Second Year</SelectItem>
                        <SelectItem value="third-year">Third Year</SelectItem>
                        <SelectItem value="final-year">Final Year</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {isLoading ? (
                  <div className="flex justify-center my-8">Loading students...</div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-muted">
                            <th className="text-left p-2">Sr. No.</th>
                            <th className="text-left p-2">URN</th>
                            <th className="text-left p-2">Mother's Name</th>
                            <th className="text-left p-2">Year</th>
                            <th className="text-left p-2">Voted</th>
                            <th className="text-right p-2">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredStudents.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="py-4 text-center">
                                {searchUrn ? "No matching students found" : "No students found"}
                              </td>
                            </tr>
                          ) : (
                            filteredStudents.map((student, index) => (
                              <tr key={student.id} className="border-b">
                                <td className="p-2">{(currentPage - 1) * 20 + index + 1}</td>
                                <td className="p-2">{student.urn}</td>
                                <td className="p-2">{student.motherName}</td>
                                <td className="p-2">{student.year}</td>
                                <td className="p-2">
                                  {student.hasVoted ? (
                                    <span className="text-green-600">Yes</span>
                                  ) : (
                                    <span className="text-red-600">No</span>
                                  )}
                                </td>
                                <td className="p-2 text-right">
                                  <Button 
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleDeleteStudent(student.id)}
                                    disabled={isLoading}
                                  >
                                    Delete
                                  </Button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                    
                    {/* Pagination - Only show when not searching */}
                    {!searchUrn && totalPages > 1 && (
                      <div className="flex justify-center mt-4 space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          disabled={currentPage === 1}
                          onClick={() => handlePageChange(currentPage - 1)}
                        >
                          Previous
                        </Button>
                        
                        <span className="flex items-center">
                          Page {currentPage} of {totalPages}
                        </span>
                        
                        <Button 
                          variant="outline" 
                          size="sm"
                          disabled={currentPage === totalPages}
                          onClick={() => handlePageChange(currentPage + 1)}
                        >
                          Next
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </Card>
            </TabsContent>
            
            {/* Add Student Tab */}
            <TabsContent value="addStudent">
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Add New Student</h2>
                
                {/* Debug Section */}
                <div className="mb-4 p-4 bg-gray-100 rounded">
                  <h3 className="font-semibold mb-2">Current Form Data:</h3>
                  <pre className="text-sm">{JSON.stringify(newStudent, null, 2)}</pre>
                  <Button 
                    onClick={async () => {
                      if (!newStudent.urn || !newStudent.motherName || !newStudent.name) {
                        toast({
                          title: "Error",
                          description: "Please fill in all fields first",
                          variant: "destructive"
                        });
                        return;
                      }
                      
                      setIsLoading(true);
                      try {
                        const response = await adminApiRequest<ApiResponse>(
                          'POST',
                          '/api/admin/students',
                          newStudent,
                          adminKey
                        );
                        
                        if (response.success) {
                          toast({
                            title: "Success",
                            description: "Student added successfully via direct call"
                          });
                          
                          setNewStudent({
                            urn: '',
                            name: '',
                            motherName: '',
                            year: 'final-year'
                          });
                          
                          await fetchStudents();
                          setActiveTab('students');
                        } else {
                          toast({
                            title: "Error",
                            description: response.message || "Failed to add student",
                            variant: "destructive"
                          });
                        }
                      } catch (error) {
                        console.error("Direct add error:", error);
                        toast({
                          title: "Error",
                          description: "Failed to add student: " + String(error),
                          variant: "destructive"
                        });
                      } finally {
                        setIsLoading(false);
                      }
                    }}
                    className="mt-2 bg-purple-600 hover:bg-purple-700 text-white"
                    disabled={isLoading}
                  >
                    Test Direct Add
                  </Button>
                </div>
                
                <form onSubmit={handleAddStudent} className="space-y-4">
                  <div>
                    <Label htmlFor="urn">URN</Label>
                    <Input
                      id="urn"
                      name="urn"
                      value={newStudent.urn}
                      onChange={handleNewStudentChange}
                      placeholder="Enter student URN"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      name="name"
                      value={newStudent.name}
                      onChange={handleNewStudentChange}
                      placeholder="Enter student name"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="motherName">Mother's Name</Label>
                    <Input
                      id="motherName"
                      name="motherName"
                      value={newStudent.motherName}
                      onChange={handleNewStudentChange}
                      placeholder="Enter mother's name"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="year">Year</Label>
                    <Select value={newStudent.year} onValueChange={handleYearChange}>
                      <SelectTrigger id="year" className="w-full">
                        <SelectValue placeholder="Select Year" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="second-year">Second Year</SelectItem>
                        <SelectItem value="third-year">Third Year</SelectItem>
                        <SelectItem value="final-year">Final Year</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    disabled={isLoading}
                  >
                    {isLoading ? "Adding..." : "Add Student"}
                  </Button>
                </form>
              </Card>
            </TabsContent>
            
            {/* Bulk Import Tab */}
            <TabsContent value="bulkImport">
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Bulk Import Students</h2>
                
                {!showPreview ? (
                  <>
                    <div className="mb-4">
                      <Label htmlFor="csvContent">CSV Content</Label>
                      <p className="text-sm text-gray-500 mb-2">
                        Paste CSV content below. Format: URN, Name, Mother's Name
                      </p>
                      <textarea
                        id="csvContent"
                        className="w-full min-h-[200px] p-2 border rounded-md font-mono"
                        value={bulkCsvContent}
                        onChange={(e) => setBulkCsvContent(e.target.value)}
                        placeholder="URN,Name,Mother's Name
123456,John Doe,Jane Doe
789012,Jane Smith,Mary Smith"
                      />
                    </div>
                    
                    <div className="mb-4">
                      <Label htmlFor="bulkYearFilter">Year for All Students</Label>
                      <Select 
                        value={newStudent.year} 
                        onValueChange={(value: string) => setNewStudent(prev => ({ ...prev, year: value }))}
                      >
                        <SelectTrigger id="bulkYearFilter" className="w-full">
                          <SelectValue placeholder="Select Year" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="second-year">Second Year</SelectItem>
                          <SelectItem value="third-year">Third Year</SelectItem>
                          <SelectItem value="final-year">Final Year</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <Button 
                      onClick={parseCsvContent} 
                      className="w-full"
                      disabled={isLoading || !bulkCsvContent.trim()}
                    >
                      Preview Import
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="mb-4">
                      <div className="flex justify-between mb-2">
                        <h3 className="font-semibold">Preview</h3>
                        <Button 
                          variant="outline"
                          size="sm"
                          onClick={() => setShowPreview(false)}
                        >
                          Edit CSV
                        </Button>
                      </div>
                      
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="bg-muted">
                              <th className="text-left p-2">URN</th>
                              <th className="text-left p-2">Name</th>
                              <th className="text-left p-2">Mother's Name</th>
                              <th className="text-left p-2">Year</th>
                            </tr>
                          </thead>
                          <tbody>
                            {parsedStudents.length === 0 ? (
                              <tr>
                                <td colSpan={4} className="py-4 text-center">
                                  No valid students found in CSV
                                </td>
                              </tr>
                            ) : (
                              parsedStudents.map((student, index) => (
                                <tr key={index} className="border-b">
                                  <td className="p-2">{student.urn}</td>
                                  <td className="p-2">{student.name}</td>
                                  <td className="p-2">{student.motherName}</td>
                                  <td className="p-2">{student.year}</td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                      
                      <div className="mt-4 text-sm">
                        Total: <strong>{parsedStudents.length}</strong> student(s)
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        variant="outline"
                        className="flex-1"
                        onClick={() => setShowPreview(false)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        className="flex-1"
                        onClick={handleBulkImport}
                        disabled={isLoading || parsedStudents.length === 0}
                      >
                        {isLoading ? "Importing..." : "Import Students"}
                      </Button>
                    </div>
                  </>
                )}
              </Card>
            </TabsContent>
            
            {/* Live Results Tab */}
            <TabsContent value="liveResults">
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Live Results</h2>
                <p className="text-center mb-4">
                  View and analyze the current election results
                </p>
                <div className="flex justify-center">
                  <Button 
                    onClick={() => window.open('/results', '_blank')}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Open Results Dashboard
                  </Button>
                </div>
              </Card>
            </TabsContent>
            
          </Tabs>
        </>
      )}
    </div>
  );
}
