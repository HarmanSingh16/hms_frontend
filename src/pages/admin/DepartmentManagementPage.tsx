import React, { useState, useEffect, useCallback } from 'react';
import { departmentsApi } from '../../api/departments';
import { Department } from '../../types/api';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { Modal } from '../../components/common/Modal';
import { Building2, Plus, Edit2, Loader2, AlertCircle } from 'lucide-react';
import { getErrorMessage } from '../../utils/errors';

export const DepartmentManagementPage: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New department state
  const [newDeptName, setNewDeptName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Edit department state
  const [editTarget, setEditTarget] = useState<Department | null>(null);
  const [editName, setEditName] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  const fetchDepartments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await departmentsApi.list();
      setDepartments(data);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to fetch departments'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newDeptName.trim().length < 2) {
      setCreateError('Department name must be between 2 and 100 characters.');
      return;
    }

    setIsCreating(true);
    setCreateError(null);

    try {
      const created = await departmentsApi.create(newDeptName.trim());
      setDepartments((prev) => [...prev, created]);
      setNewDeptName('');
    } catch (err: unknown) {
      setCreateError(getErrorMessage(err, 'Failed to create department.'));
    } finally {
      setIsCreating(false);
    }
  };

  const openEditModal = (dept: Department) => {
    setEditTarget(dept);
    setEditName(dept.name);
    setUpdateError(null);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;

    if (editName.trim().length < 2) {
      setUpdateError('Department name must be between 2 and 100 characters.');
      return;
    }

    setIsUpdating(true);
    setUpdateError(null);

    try {
      const updated = await departmentsApi.update(editTarget.id, editName.trim());
      setDepartments((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
      setEditTarget(null);
    } catch (err: unknown) {
      setUpdateError(getErrorMessage(err, 'Failed to update department name.'));
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Clinical Departments</h1>
        <p className="text-xs text-slate-500 mt-1">
          Configure hospital departments, specialties, and clinical units.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Create New Department Form */}
      <Card title="Add Clinical Department">
        <form onSubmit={handleCreate} className="space-y-3">
          {createError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{createError}</span>
            </div>
          )}

          <div className="flex items-center gap-3">
            <div className="flex-1">
              <Input
                placeholder="e.g. Dermatology, Endocrinology, Radiology"
                value={newDeptName}
                onChange={(e) => setNewDeptName(e.target.value)}
                required
                minLength={2}
                maxLength={100}
              />
            </div>
            <Button
              type="submit"
              isLoading={isCreating}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Add Department
            </Button>
          </div>
        </form>
      </Card>

      {/* Departments Table */}
      <Card title={`Active Departments (${departments.length})`}>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-500">
            <Loader2 className="w-6 h-6 animate-spin text-sky-600 mb-2" />
            <p className="text-xs">Loading department registry...</p>
          </div>
        ) : departments.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-8">No departments defined.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {departments.map((dept) => (
              <div
                key={dept.id}
                className="py-3 px-2 flex items-center justify-between hover:bg-slate-50 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-semibold text-slate-800 text-sm">{dept.name}</span>
                    <span className="text-[11px] text-slate-400 font-mono ml-2">ID #{dept.id}</span>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openEditModal(dept)}
                  leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                >
                  Rename
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Edit Modal */}
      <Modal
        isOpen={!!editTarget}
        onClose={() => setEditTarget(null)}
        title="Rename Department"
        maxWidth="md"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditTarget(null)}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button size="sm" onClick={handleUpdate} isLoading={isUpdating}>
              Save Name
            </Button>
          </>
        }
      >
        <form onSubmit={handleUpdate} className="space-y-4">
          {updateError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{updateError}</span>
            </div>
          )}

          <Input
            label="Department Name"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            required
            minLength={2}
            maxLength={100}
          />
        </form>
      </Modal>
    </div>
  );
};
