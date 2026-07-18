import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { X, Upload, FileSpreadsheet, AlertCircle, CheckCircle2 } from "lucide-react";
import { apiClient } from "@/lib/apiClient";
import * as XLSX from "xlsx";

interface ImportStudentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  schoolId: string | null;
  onImportComplete: () => void;
}

interface ParsedRow {
  name: string;
  standard: string;
  section: string;
  roll_no: number;
  parent_name: string;
  parent_contact: string;
  secret_id?: string;
}

type ImportStatus = "idle" | "parsing" | "importing" | "done" | "error";

const generateSecretId = (): string => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const part = (len: number) =>
    Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `EDU-${part(4)}-${part(5)}`;
};

const ImportStudentsModal = ({ isOpen, onClose, schoolId, onImportComplete }: ImportStudentsModalProps) => {
  const [status, setStatus] = useState<ImportStatus>("idle");
  const [fileName, setFileName] = useState("");
  const [validRows, setValidRows] = useState<ParsedRow[]>([]);
  const [skippedCount, setSkippedCount] = useState(0);
  const [skippedReasons, setSkippedReasons] = useState<string[]>([]);
  const [importedCount, setImportedCount] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setStatus("idle");
    setFileName("");
    setValidRows([]);
    setSkippedCount(0);
    setSkippedReasons([]);
    setImportedCount(0);
    setErrorMsg("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext !== "xlsx" && ext !== "csv") {
      setErrorMsg("Only .xlsx and .csv files are allowed.");
      setStatus("error");
      return;
    }

    setFileName(file.name);
    setStatus("parsing");
    setErrorMsg("");

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json: any[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

      if (json.length === 0) {
        setErrorMsg("File is empty or has no data rows.");
        setStatus("error");
        return;
      }

      if (json.length > 1000) {
        setErrorMsg("Maximum 1000 students per upload. Your file has " + json.length + " rows.");
        setStatus("error");
        return;
      }

      const valid: ParsedRow[] = [];
      const reasons: string[] = [];
      let skipped = 0;

      json.forEach((row, i) => {
        const name = String(row.name || "").trim();
        const standard = String(row.standard || "").trim();
        const rollRaw = parseInt(String(row.roll_no || ""), 10);
        const section = String(row.section || "").trim();

        if (!name) {
          skipped++;
          reasons.push(`Row ${i + 2}: name is empty`);
          return;
        }
        if (!standard) {
          skipped++;
          reasons.push(`Row ${i + 2}: standard is missing`);
          return;
        }
        if (!rollRaw || rollRaw <= 0) {
          skipped++;
          reasons.push(`Row ${i + 2}: roll_no is missing or invalid`);
          return;
        }

        valid.push({
          name,
          standard,
          section: section || "A",
          roll_no: rollRaw,
          parent_name: String(row.parent_name || "").trim(),
          parent_contact: String(row.parent_contact || "").trim(),
          secret_id: String(row.secret_id || "").trim() || undefined,
        });
      });

      setValidRows(valid);
      setSkippedCount(skipped);
      setSkippedReasons(reasons);
      setStatus(valid.length > 0 ? "idle" : "error");
      if (valid.length === 0) {
        setErrorMsg("No valid rows found after validation.");
      }
    } catch {
      setErrorMsg("Failed to parse file. Please check the format.");
      setStatus("error");
    }
  };

  const handleImport = async () => {
    if (!schoolId || validRows.length === 0) return;
    setStatus("importing");
    setErrorMsg("");

    try {
      const { data: { user } } = await apiClient.auth.getUser();
      if (!user) {
        setErrorMsg("Not authenticated.");
        setStatus("error");
        return;
      }

      // Generate secret_ids for rows that don't have one
      // We need unique ones, so collect used ones
      const usedIds = new Set<string>();
      const rows = validRows.map((r) => {
        let secretId = r.secret_id;
        if (!secretId) {
          do {
            secretId = generateSecretId();
          } while (usedIds.has(secretId));
        }
        usedIds.add(secretId);
        return {
          name: r.name,
          standard: r.standard,
          section: r.section,
          roll_no: r.roll_no,
          parent_name: r.parent_name || null,
          parent_contact: r.parent_contact || null,
          secret_id: secretId,
          school_id: schoolId,
          created_by: user.id,
        };
      });

      // Batch insert in chunks of 100
      const BATCH = 100;
      let inserted = 0;
      for (let i = 0; i < rows.length; i += BATCH) {
        const chunk = rows.slice(i, i + BATCH);
        const { data, error } = await apiClient.from("students").insert(chunk as any).select();
        if (error) {
          setErrorMsg(`Import error at batch ${Math.floor(i / BATCH) + 1}: ${error.message}`);
          setStatus("error");
          return;
        }
        inserted += data?.length || 0;
      }

      setImportedCount(inserted);
      setStatus("done");
      onImportComplete();
    } catch (err: any) {
      setErrorMsg(err.message || "Import failed.");
      setStatus("error");
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 z-50 flex justify-center items-start overflow-y-auto p-4"
      style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 16px)", paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 16px)" }}
      onClick={handleClose}
    >
      <div
        className="bg-black/90 backdrop-blur-2xl rounded-2xl p-5 sm:p-8 w-full max-w-lg border border-primary/30 relative max-h-[calc(100dvh-env(safe-area-inset-top,0px)-env(safe-area-inset-bottom,0px)-2rem)] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold text-primary mb-2">Import Students</h2>
        <p className="text-foreground/50 text-sm mb-6">
          Upload an Excel (.xlsx) or CSV file with columns: name, standard, section, roll_no, parent_name, parent_contact, secret_id (optional)
        </p>
        <Button
          onClick={handleClose}
          className="absolute top-4 right-4 bg-transparent hover:bg-primary/10 p-2 h-auto rounded-full"
        >
          <X className="text-foreground/70" size={20} />
        </Button>

        {status === "done" ? (
          <div className="space-y-4 text-center py-6">
            <CheckCircle2 size={48} className="text-green-500 mx-auto" />
            <p className="text-foreground text-lg font-bold">Import Complete!</p>
            <p className="text-foreground/70">
              {importedCount} student{importedCount !== 1 ? "s" : ""} imported successfully.
              {skippedCount > 0 && ` ${skippedCount} row${skippedCount !== 1 ? "s" : ""} skipped.`}
            </p>
            <Button onClick={handleClose} className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold">
              Close
            </Button>
          </div>
        ) : (
          <div className="space-y-5">
            {/* File upload */}
            <div className="border-2 border-dashed border-primary/30 rounded-xl p-6 text-center relative">
              <FileSpreadsheet size={36} className="text-primary/40 mx-auto mb-3" />
              <p className="text-foreground/60 text-sm mb-2">
                {fileName || "Click or drag to upload .xlsx or .csv"}
              </p>
              <Button variant="outline" className="bg-black/40 border-primary/20 hover:bg-primary/10 text-foreground/80">
                <Upload size={16} className="mr-2" /> Choose File
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,.csv"
                onChange={handleFile}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>

            {/* Parsed summary */}
            {validRows.length > 0 && status !== "error" && (
              <div className="bg-black/40 border border-primary/20 rounded-lg p-4 space-y-2">
                <p className="text-foreground text-sm">
                  <span className="text-primary font-bold">{validRows.length}</span> valid student{validRows.length !== 1 ? "s" : ""} ready to import
                </p>
                {skippedCount > 0 && (
                  <div>
                    <p className="text-destructive text-sm font-semibold">
                      {skippedCount} row{skippedCount !== 1 ? "s" : ""} skipped:
                    </p>
                    <ul className="text-xs text-foreground/50 max-h-24 overflow-y-auto mt-1 space-y-0.5">
                      {skippedReasons.map((r, i) => (
                        <li key={i}>• {r}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Error */}
            {(status === "error" || errorMsg) && (
              <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle size={20} className="text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-destructive text-sm">{errorMsg}</p>
              </div>
            )}

            {/* Import button */}
            {validRows.length > 0 && status !== "error" && (
              <Button
                onClick={handleImport}
                disabled={status === "importing"}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold py-3 shadow-[0_0_20px_hsl(51,100%,50%,0.3)]"
              >
                {status === "importing" ? "Importing..." : `Import ${validRows.length} Students`}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ImportStudentsModal;
