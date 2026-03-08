import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, ArrowLeft, Trash2, Users, Edit2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import useAppStore from '@/store/appStore';
import { useSchoolId } from '@/hooks/useSchoolId';

const standards = ['Nursery', 'LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
const sections = ['A', 'B', 'C', 'D', 'E'];

const getSortableClassIndex = (classVal: string) => {
  const standard = classVal.replace('Class ', '');
  return standards.indexOf(standard) === -1 ? Infinity : standards.indexOf(standard);
};

const getNextStandard = (currentStandard: string) => {
  const currentIndex = standards.indexOf(currentStandard);
  if (currentIndex > -1 && currentIndex < standards.length - 1) return standards[currentIndex + 1];
  return null;
};

const getPreviousStandard = (currentStandard: string) => {
  const currentIndex = standards.indexOf(currentStandard);
  if (currentIndex > 0) return standards[currentIndex - 1];
  return null;
};

const PromotionPanelPage = () => {
  const { toast } = useToast();
  const schoolId = useSchoolId();
  const students = useAppStore(state => state.students);
  const updateStudent = useAppStore(state => state.updateStudent);
  const deleteStudentFromStore = useAppStore(state => state.deleteStudent);
  const fetchStudents = useAppStore(state => state.fetchStudents);
  const [selectedClass, setSelectedClass] = useState('All Classes');
  const [selectedSection, setSelectedSection] = useState('All Sections');
  const [searchTerm, setSearchTerm] = useState('');
  const [bulkFromClass, setBulkFromClass] = useState('');
  const [bulkSection, setBulkSection] = useState('');
  const [isBulkPromoting, setIsBulkPromoting] = useState(false);

  // Section change modal state
  const [changingSectionFor, setChangingSectionFor] = useState<string | null>(null);
  const [newSection, setNewSection] = useState('');

  useEffect(() => {
    if (schoolId) fetchStudents(schoolId);
  }, [schoolId]);

  const handleAction = async (id: string, action: string) => {
    const student = students.find(s => s.id === id);
    if (!student) return;
    let title = '', description = '';
    switch (action) {
      case 'promote': {
        const nextClass = getNextStandard(student.standard);
        if (nextClass) {
          await updateStudent(id, { standard: nextClass });
          title = "Student Promoted!";
          description = `${student.name} promoted to Class ${nextClass}.`;
        } else {
          await deleteStudentFromStore(id);
          title = "Student Graduated!";
          description = `${student.name} has graduated.`;
        }
        break;
      }
      case 'back': {
        const prevClass = getPreviousStandard(student.standard);
        if (prevClass) {
          await updateStudent(id, { standard: prevClass });
          title = "Student Demoted";
          description = `${student.name} moved back to Class ${prevClass}.`;
        } else {
          toast({ title: 'Cannot go back', description: `${student.name} is already in the lowest class.`, variant: 'destructive' });
          return;
        }
        break;
      }
      case 'delete':
        await deleteStudentFromStore(id);
        title = "Student Deleted";
        description = `${student.name} has been removed.`;
        break;
      default: return;
    }
    if (schoolId) await fetchStudents(schoolId);
    toast({ title, description, variant: action === 'delete' ? 'destructive' : 'default' });
  };

  const handleSectionChange = async (studentId: string) => {
    if (!newSection) return;
    const student = students.find(s => s.id === studentId);
    if (!student) return;
    await updateStudent(studentId, { section: newSection });
    if (schoolId) await fetchStudents(schoolId);
    toast({ title: 'Section Changed', description: `${student.name} moved to Section ${newSection}.` });
    setChangingSectionFor(null);
    setNewSection('');
  };

  const handleBulkPromote = async () => {
    if (!bulkFromClass) {
      toast({ title: 'Select a class', description: 'Choose a class to promote from.', variant: 'destructive' });
      return;
    }
    const nextClass = getNextStandard(bulkFromClass);
    const targets = students.filter(s => {
      if (s.standard !== bulkFromClass) return false;
      if (bulkSection && s.section !== bulkSection) return false;
      return true;
    });
    if (targets.length === 0) {
      toast({ title: 'No students found', description: 'No students in the selected class/section.', variant: 'destructive' });
      return;
    }
    setIsBulkPromoting(true);
    let promoted = 0, graduated = 0;
    for (const s of targets) {
      if (nextClass) {
        await updateStudent(s.id, { standard: nextClass });
        promoted++;
      } else {
        await deleteStudentFromStore(s.id);
        graduated++;
      }
    }
    if (schoolId) await fetchStudents(schoolId);
    toast({
      title: 'Bulk Promotion Complete!',
      description: nextClass
        ? `${promoted} student(s) promoted to Class ${nextClass}.${bulkSection ? ` (Section ${bulkSection})` : ''}`
        : `${graduated} student(s) graduated.`,
    });
    setIsBulkPromoting(false);
    setBulkFromClass('');
    setBulkSection('');
  };

  const availableClasses = useMemo(() => [...new Set(students.map(s => `Class ${s.standard}`))].sort((a, b) => getSortableClassIndex(a) - getSortableClassIndex(b)), [students]);
  const availableSections = useMemo(() => [...new Set(students.map(s => s.section))].sort(), [students]);

  const filteredStudents = useMemo(() => {
    return students
      .filter(s => selectedClass === 'All Classes' || `Class ${s.standard}` === selectedClass)
      .filter(s => selectedSection === 'All Sections' || s.section === selectedSection)
      .filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [students, selectedClass, selectedSection, searchTerm]);

  const groupedStudents = useMemo(() => {
    const groups = filteredStudents.reduce((acc: any, student) => {
      const classKey = `Class ${student.standard}`;
      if (!acc[classKey]) acc[classKey] = [];
      acc[classKey].push(student);
      return acc;
    }, {});
    return Object.keys(groups).sort((a, b) => getSortableClassIndex(a) - getSortableClassIndex(b)).reduce((acc: any, key) => { acc[key] = groups[key]; return acc; }, {});
  }, [filteredStudents]);

  return (
    <div className="space-y-4 px-4 pb-10 relative z-10 py-6">
      <div className="text-center pt-4">
        <h1 className="text-3xl font-bold text-foreground drop-shadow-[0_0_10px_hsl(51,100%,50%,0.3)]">Promotion Panel</h1>
        <p className="text-foreground/80">Manage student promotions for the new academic year</p>
      </div>

      {/* Bulk Promotion */}
      <div className="bg-black/20 backdrop-blur-md border border-primary/30 rounded-2xl p-4 sm:p-6 max-w-4xl mx-auto space-y-4 shadow-[0_0_30px_hsl(51,100%,50%,0.08)]">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-primary/30 flex items-center justify-center shadow-[0_0_12px_hsl(51,100%,50%,0.3)]"><Users size={20} className="text-primary" /></div>
          <h2 className="text-lg font-semibold text-foreground">Bulk Promotion</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold tracking-wider text-primary/60 mb-2">FROM CLASS</label>
            <select value={bulkFromClass} onChange={e => setBulkFromClass(e.target.value)} className="w-full px-4 py-3 bg-black/40 border-primary/20 border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40">
              <option value="">Select class</option>
              {standards.map(s => <option key={s} value={s}>Class {s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold tracking-wider text-primary/60 mb-2">TO CLASS</label>
            <div className="w-full px-4 py-3 bg-black/20 border-primary/10 border rounded-lg text-foreground/60">
              {bulkFromClass ? (getNextStandard(bulkFromClass) ? `Class ${getNextStandard(bulkFromClass)}` : 'Graduate') : '—'}
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold tracking-wider text-primary/60 mb-2">SECTION (Optional)</label>
            <select value={bulkSection} onChange={e => setBulkSection(e.target.value)} className="w-full px-4 py-3 bg-black/40 border-primary/20 border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40">
              <option value="">All Sections</option>
              {sections.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <Button onClick={handleBulkPromote} disabled={isBulkPromoting || !bulkFromClass} className="w-full bg-green-400/20 hover:bg-green-400/30 text-green-300 font-bold py-3 rounded-lg border border-green-400/30">
          <CheckCircle size={18} className="mr-2" />{isBulkPromoting ? 'Promoting...' : 'Promote All'}
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-black/20 backdrop-blur-md border border-primary/30 rounded-2xl p-4 sm:p-6 max-w-4xl mx-auto space-y-4 shadow-[0_0_30px_hsl(51,100%,50%,0.08)]">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold tracking-wider text-primary/70 mb-2">CLASS</label>
            <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className="w-full px-4 py-3 bg-black/40 border-primary/20 border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40">
              <option value="All Classes">All Classes</option>
              {availableClasses.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold tracking-wider text-primary/60 mb-2">SECTION</label>
            <select value={selectedSection} onChange={e => setSelectedSection(e.target.value)} className="w-full px-4 py-3 bg-black/40 border-primary/20 border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40">
              <option value="All Sections">All Sections</option>
              {availableSections.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold tracking-wider text-primary/60 mb-2">STUDENT NAME</label>
            <input type="text" placeholder="Search student..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full px-4 py-3 bg-black/40 border-primary/20 border rounded-lg text-foreground placeholder:text-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40" />
          </div>
        </div>
      </div>

      {/* Student Cards */}
      <div className="space-y-8 max-w-4xl mx-auto">
        {Object.keys(groupedStudents).length > 0 ? (
          Object.keys(groupedStudents).map(classGroup => (
            <div key={classGroup}>
              <h2 className="text-foreground text-xl font-bold mb-3 px-2 drop-shadow-[0_0_8px_hsl(51,100%,50%,0.25)]">{classGroup}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {groupedStudents[classGroup].map((student: any) => {
                  const nextClass = getNextStandard(student.standard);
                  const prevClass = getPreviousStandard(student.standard);
                  return (
                    <div key={student.id} className="bg-black/20 backdrop-blur-md border border-primary/25 rounded-2xl p-4 space-y-3 shadow-[0_0_15px_hsl(51,100%,50%,0.06)] hover:border-primary/50 hover:shadow-[0_0_25px_hsl(51,100%,50%,0.2)] transition-all duration-300">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-lg text-foreground drop-shadow-[0_0_6px_hsl(51,100%,50%,0.2)]">{student.name}</h3>
                          <p className="text-xs text-foreground/60">Section {student.section} • Roll {student.roll_no || '—'}</p>
                        </div>
                      </div>

                      {/* Section change inline */}
                      {changingSectionFor === student.id ? (
                        <div className="flex items-center gap-2">
                          <select value={newSection} onChange={e => setNewSection(e.target.value)} className="flex-1 px-3 py-2 bg-black/40 border-primary/20 border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40">
                            <option value="">Select Section</option>
                            {sections.filter(s => s !== student.section).map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                          <Button onClick={() => handleSectionChange(student.id)} disabled={!newSection} className="bg-primary/20 hover:bg-primary/30 text-primary font-bold text-xs px-3 py-2 border border-primary/30">Save</Button>
                          <Button onClick={() => { setChangingSectionFor(null); setNewSection(''); }} className="bg-black/40 hover:bg-black/60 text-foreground/60 text-xs px-3 py-2 border border-primary/10">Cancel</Button>
                        </div>
                      ) : null}

                      <div className="space-y-2">
                        <Button onClick={() => handleAction(student.id, 'promote')} className="w-full bg-green-400/20 hover:bg-green-400/30 text-green-300 font-bold py-2 rounded-lg border border-green-400/30 text-sm shadow-[0_0_10px_hsl(120,60%,50%,0.1)]">
                          <CheckCircle size={16} className="mr-2" />{nextClass ? `Promote to Class ${nextClass}` : 'Graduate'}
                        </Button>
                        <div className="grid grid-cols-3 gap-2">
                          <Button onClick={() => handleAction(student.id, 'back')} disabled={!prevClass} className="w-full bg-blue-400/20 hover:bg-blue-400/30 text-blue-300 font-bold py-2 rounded-lg border border-blue-400/30 text-sm disabled:opacity-40">
                            <ArrowLeft size={16} className="mr-1" />Back
                          </Button>
                          <Button onClick={() => { setChangingSectionFor(student.id); setNewSection(''); }} className="w-full bg-purple-400/20 hover:bg-purple-400/30 text-purple-300 font-bold py-2 rounded-lg border border-purple-400/30 text-sm">
                            <Edit2 size={16} className="mr-1" />Section
                          </Button>
                          <Button onClick={() => handleAction(student.id, 'delete')} className="w-full bg-red-400/20 hover:bg-red-400/30 text-red-300 font-bold py-2 rounded-lg border border-red-400/30 text-sm">
                            <Trash2 size={16} className="mr-1" />Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-16">
            <p className="text-foreground/50 text-lg">No students found.</p>
            <p className="text-foreground/40">Add students first from the Student Management page.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PromotionPanelPage;
