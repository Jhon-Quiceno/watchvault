"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Download, FileText, ListPlus, LogOut, Save, Upload } from "lucide-react";
import { toast } from "sonner";

import type { CustomList, LibraryEntry } from "@/types/media";
import { apiClient } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { useProfile } from "@/stores/profile-store";
import { useLibrary } from "@/features/library/hooks/use-library";
import { buildNameExport } from "@/features/profile/lib/parse-names";
import { ImportNamesDialog } from "@/features/profile/components/import-names-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface ExportPayload {
  version: 1;
  exportedAt: string;
  entries: LibraryEntry[];
  lists: CustomList[];
}

export function ProfileView() {
  const profile = useProfile();
  const { data: entries = [] } = useLibrary();
  const queryClient = useQueryClient();
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(profile.name);
  const [bio, setBio] = useState(profile.bio);
  const [busy, setBusy] = useState(false);
  const [importNamesOpen, setImportNamesOpen] = useState(false);

  async function logout() {
    await apiClient.post("/auth/logout");
    router.push("/login");
    router.refresh();
  }

  function saveProfile() {
    profile.setProfile({ name: name.trim() || "Yo", bio: bio.trim() });
    toast.success("Perfil guardado");
  }

  async function exportLibrary() {
    setBusy(true);
    try {
      const [libraryRes, listsRes] = await Promise.all([
        apiClient.get<{ entries: LibraryEntry[] }>("/library"),
        apiClient.get<{ lists: CustomList[] }>("/lists"),
      ]);
      const payload: ExportPayload = {
        version: 1,
        exportedAt: new Date().toISOString(),
        entries: libraryRes.data.entries,
        lists: listsRes.data.lists,
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `watchvault-export-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Falló la exportación");
    } finally {
      setBusy(false);
    }
  }

  async function importLibrary(file: File) {
    setBusy(true);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as { entries?: LibraryEntry[] };
      if (!Array.isArray(parsed.entries)) {
        toast.error("Archivo de exportación no reconocido");
        return;
      }
      const { data } = await apiClient.post<{ imported: number }>("/library/import", {
        entries: parsed.entries,
      });
      await queryClient.invalidateQueries({ queryKey: queryKeys.library.all });
      toast.success(
        `Se importaron ${data.imported} ${data.imported === 1 ? "título nuevo" : "títulos nuevos"}`,
      );
    } catch {
      toast.error("Falló la importación");
    } finally {
      setBusy(false);
    }
  }

  function exportNamesList() {
    const text = buildNameExport(entries);
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `watchvault-nombres-${new Date().toISOString().slice(0, 10)}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }

  const initials =
    name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "YO";

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Perfil</h1>

      <Card>
        <CardContent className="flex flex-col gap-5">
          <div className="flex items-center gap-4">
            <Avatar className="size-16">
              {profile.avatarUrl && <AvatarImage src={profile.avatarUrl} alt={name} />}
              <AvatarFallback className="bg-gradient-brand text-lg text-white">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="text-lg font-semibold">{profile.name}</p>
              <p className="text-muted-foreground text-sm">
                {entries.length} {entries.length === 1 ? "título" : "títulos"} registrados
              </p>
            </div>
          </div>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-muted-foreground text-xs font-medium">Nombre visible</span>
            <Input value={name} onChange={(event) => setName(event.target.value)} />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-muted-foreground text-xs font-medium">Biografía</span>
            <Textarea rows={3} value={bio} onChange={(event) => setBio(event.target.value)} />
          </label>
          <Button className="w-fit gap-1.5" onClick={saveProfile}>
            <Save className="size-4" />
            Guardar perfil
          </Button>
        </CardContent>
      </Card>

      {process.env.NEXT_PUBLIC_DEMO_MODE !== "true" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Respaldo</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button variant="outline" className="gap-1.5" disabled={busy} onClick={exportLibrary}>
              <Download className="size-4" />
              Exportar biblioteca
            </Button>
            <Button
              variant="outline"
              className="gap-1.5"
              disabled={busy}
              onClick={() => fileInput.current?.click()}
            >
              <Upload className="size-4" />
              Importar biblioteca
            </Button>
            <Button
              variant="outline"
              className="gap-1.5"
              disabled={entries.length === 0}
              onClick={exportNamesList}
            >
              <FileText className="size-4" />
              Exportar como lista
            </Button>
            <Button
              variant="outline"
              className="gap-1.5"
              onClick={() => setImportNamesOpen(true)}
            >
              <ListPlus className="size-4" />
              Importar por nombres
            </Button>
            <input
              ref={fileInput}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void importLibrary(file);
                event.target.value = "";
              }}
            />
          </CardContent>
        </Card>
      )}

      {process.env.NEXT_PUBLIC_DEMO_MODE !== "true" && (
        <ImportNamesDialog open={importNamesOpen} onOpenChange={setImportNamesOpen} />
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sesión</CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="outline" className="gap-1.5" onClick={() => void logout()}>
            <LogOut className="size-4" />
            Cerrar sesión
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
