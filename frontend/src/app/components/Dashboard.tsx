import React, { useState, useEffect } from 'react';
import { 
  Upload, Download, Eye, Trash2, File, Folder, 
  MoreVertical, Grid, List, Search, Plus, X,
  FileText, FileImage, FileVideo, FileArchive,
  ChevronRight, Home, Share2, Star, Clock,
  FolderPlus, Edit2, AlertCircle, Loader
} from 'lucide-react';
import { apiClient } from '../../../lib/api';

interface FileItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  fileType?: string;
  size: string;
  modified: string;
  owner: string;
  folder: string;
  mimeType?: string;
}

const FileManagementPage = () => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState<string | null>(null);
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [folderPath, setFolderPath] = useState<Array<{id: string, name: string}>>([]);
  
  // Storage stats
  const [storageUsed, setStorageUsed] = useState('0 GB');
  const [storageLimit, setStorageLimit] = useState('10 GB');
  const [storagePercentage, setStoragePercentage] = useState(0);
  
  // File preview
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renamingItem, setRenamingItem] = useState<FileItem | null>(null);
  const [newName, setNewName] = useState('');


  
  useEffect(() => {
    fetchFiles();
    fetchStorageStats();
  }, [currentFolderId]);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (currentFolderId) {
        params.append('folderId', currentFolderId);
      }
      
      const response = await apiClient.get(`/api/files?${params.toString()}`);
      
      if (response.success) {
        setFiles(response.data.items);
        if (response.data.currentFolderId) {
          setCurrentFolderId(response.data.currentFolderId);
        }
      }
    } catch (err) {
      console.error('Error fetching files:', err);
      setError('Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  const fetchStorageStats = async () => {
    try {
      // Get organization ID from user context
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const orgId = user.organizationId;
      
      if (!orgId) return;
      
      const response = await apiClient.get(`/api/organizations/${orgId}/dashboard`);
      
      if (response.success) {
        setStorageUsed(response.data.stats.storageUsed);
        setStorageLimit(response.data.stats.storageLimit);
        setStoragePercentage(response.data.stats.spaceUsedPercentage);
      }
    } catch (err) {
      console.error('Error fetching storage stats:', err);
    }
  };

  const handleFileUpload = async (
  event: React.ChangeEvent<HTMLInputElement>
) => {
  const uploadedFiles = event.target.files;
  if (!uploadedFiles?.length) return;

  setUploading(true);

  try {
    for (let i = 0; i < uploadedFiles.length; i++) {
      const file = uploadedFiles[i];
      const formData = new FormData();

      formData.append('file', file);
      if (currentFolderId) {
        formData.append('folderId', currentFolderId);
      }

      const response = await apiClient.postFormData(
        '/api/files/upload',
        formData,
      );

      if (response.data.success) {
        setFiles(prev => [...prev, response.data.data]);
      }
    }

    await fetchFiles();
    setShowUploadModal(false);
    await fetchStorageStats();

  } catch (err) {
    console.error('Upload error:', err);
    alert('Upload failed');
  } finally {
    setUploading(false);
    event.target.value = '';
  }
};



  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    
    try {
      const response = await apiClient.post('/api/folders', {
        name: newFolderName,
        parentId: currentFolderId
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.success) {
        setFiles(prev => [...prev, response.data]);
        setNewFolderName('');
        setShowNewFolderModal(false);
      }
    } catch (err) {
      console.error('Create folder error:', err);
      alert('Failed to create folder: ' + (err || 'Unknown error'));
    }
  };

  const handleDeleteFile = async (fileId: string, type: 'file' | 'folder') => {
    if (!confirm(`Are you sure you want to delete this ${type}?`)) return;

    try {
      const endpoint = type === 'file' ? `/api/files/${fileId}` : `/api/folders/${fileId}`;
      const response = await apiClient.delete(endpoint, { data: { password: '' } });

      if (response.success) {
        setFiles(files.filter(f => f.id !== fileId));
        setShowDropdown(null);
        await fetchStorageStats();
      }
    } catch (err) {
      console.error('Delete error:', err);
      alert('Delete failed: ' + (err || 'Unknown error'));
    }
  };

  const handleDownloadFile = async (fileId: string, fileName: string) => {
    try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No token');

        const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/files/${fileId}/download`,
        {
            method: 'GET',
            headers: {
            Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            throw new Error('Download failed');
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();

        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        setShowDropdown(null);
    } catch (err) {
        console.error('Download error:', err);
        alert('Download failed');
    }
  };


  const handleViewFile = (file: FileItem) => {
  if (file.type === 'folder') {
    setCurrentFolderId(file.id);
    setFolderPath(prev => [...prev, { id: file.id, name: file.name }]);
  } else {
    if (
      file.mimeType?.startsWith('image/') ||
      file.mimeType === 'application/pdf'
    ) {
      openPreview(file);
    } else {
      handleDownloadFile(file.id, file.name);
    }
  }

  setShowDropdown(null);
};


    const openPreview = async (file: FileItem) => {
  try {
    setPreviewLoading(true);
    const token = localStorage.getItem('token');

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/files/${file.id}/download`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    if (!res.ok) throw new Error('Preview failed');

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);

    setPreviewFile(file);
    setPreviewUrl(url);
  } catch (err) {
    console.error(err);
    alert('Cannot preview file');
  } finally {
    setPreviewLoading(false);
  }
};

  const openRenameModal = (file: FileItem) => {
    setRenamingItem(file);
    setNewName(file.name);
    setShowRenameModal(true);
    setShowDropdown(null);
  };

  const handleRename = async () => {
  if (!renamingItem || !newName.trim()) return;

  try {
    const endpoint =
      renamingItem.type === 'file'
        ? `/api/files/${renamingItem.id}/rename`
        : `/api/folders/${renamingItem.id}/rename`;

    const response = await apiClient.patch(endpoint, {
      name: newName.trim(),
    });

    if (response.success) {
      // update UI
      setFiles(prev =>
        prev.map(f =>
          f.id === renamingItem.id ? { ...f, name: newName } : f
        )
      );
      setShowRenameModal(false);
      setRenamingItem(null);
    }
  } catch (err) {
    console.error('Rename error:', err);
    alert('Rename failed');
  }
};




  const handleSearch = async () => {
    if (searchQuery.length < 2) {
      fetchFiles();
      return;
    }

    try {
      setLoading(true);
      const response = await apiClient.get(`/api/files/search?query=${encodeURIComponent(searchQuery)}`);
      
      if (response.success) {
        setFiles(response.data);
      }
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const navigateToFolder = (folderId: string | null, index?: number) => {
    if (folderId === null) {
      // Go to root
      setCurrentFolderId(null);
      setFolderPath([]);
    } else if (index !== undefined) {
      // Navigate to specific folder in path
      setCurrentFolderId(folderId);
      setFolderPath(prev => prev.slice(0, index + 1));
    }
  };

  const toggleFileSelection = (fileId: string) => {
    setSelectedFiles(prev => 
      prev.includes(fileId) 
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    );
  };

  const handleBulkDelete = async () => {
    if (selectedFiles.length === 0) return;
    if (!confirm(`Delete ${selectedFiles.length} item(s)?`)) return;

    try {
      for (const fileId of selectedFiles) {
        const file = files.find(f => f.id === fileId);
        if (file) {
          const endpoint = file.type === 'file' ? `/api/files/${fileId}` : `/api/folders/${fileId}`;
          await apiClient.delete(endpoint, { data: { password: '' } });
        }
      }
      
      setFiles(files.filter(f => !selectedFiles.includes(f.id)));
      setSelectedFiles([]);
      await fetchStorageStats();
    } catch (err) {
      console.error('Bulk delete error:', err);
      alert('Some items failed to delete');
    }
  };

  const getFileIcon = (fileType?: string) => {
    switch(fileType) {
      case 'pdf':
      case 'doc':
        return <FileText className="w-8 h-8 text-blue-500" />;
      case 'image':
        return <FileImage className="w-8 h-8 text-green-500" />;
      case 'video':
        return <FileVideo className="w-8 h-8 text-purple-500" />;
      case 'zip':
        return <FileArchive className="w-8 h-8 text-orange-500" />;
      default:
        return <File className="w-8 h-8 text-gray-500" />;
    }
  };

  const filteredFiles = searchQuery.length < 2 
    ? files 
    : files.filter(file => 
        file.name.toLowerCase().includes(searchQuery.toLowerCase())
      );

  if (loading && files.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading files...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={fetchFiles}
            className="w-full py-3 px-6 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-red-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6">
          <button 
            onClick={() => setShowUploadModal(true)}
            className="w-full px-4 py-3 bg-linear-to-r cursor-pointer from-red-500 via-orange-500 to-yellow-500 text-white rounded-lg hover:from-red-600 hover:via-orange-600 hover:to-yellow-600 transition-colors flex items-center justify-center gap-2 font-medium mb-6"
          >
            <Plus className="w-5 h-5" />
            Upload Files
          </button>

          <nav className="space-y-1">
            <button 
              onClick={() => navigateToFolder(null)}
              className="w-full flex items-center gap-3 px-3 py-2 bg-blue-50 text-orange-600 rounded-lg font-medium"
            >
              <Home className="w-5 h-5" />
              <span className="text-sm">My Files</span>
            </button>
            <a href="#" className="flex items-center gap-3 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg">
              <Share2 className="w-5 h-5" />
              <span className="text-sm">Shared with me</span>
            </a>
            <a href="#" className="flex items-center gap-3 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg">
              <Star className="w-5 h-5" />
              <span className="text-sm">Starred</span>
            </a>
            <a href="#" className="flex items-center gap-3 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg">
              <Clock className="w-5 h-5" />
              <span className="text-sm">Recent</span>
            </a>
          </nav>
        </div>

        <div className="mt-auto p-6 border-t border-gray-200">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm font-medium text-gray-700 mb-2">Storage</div>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
              <div 
                className="bg-orange-600 h-2 rounded-full transition-all" 
                style={{ width: `${Math.min(storagePercentage, 100)}%` }}
              ></div>
            </div>
            <div className="text-xs text-gray-600">
              {storageUsed} of {storageLimit} used
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <button onClick={() => navigateToFolder(null)} className="hover:text-gray-900 cursor-pointer">
                <Home className="w-4 h-4" />
              </button>
              {folderPath.map((folder, index) => (
                <React.Fragment key={folder.id}>
                  <ChevronRight className="w-4 h-4" />
                  <button
                    onClick={() => navigateToFolder(folder.id, index)}
                    className="font-medium text-gray-900 hover:text-orange-600 cursor-pointer"
                  >
                    {folder.name}
                  </button>
                </React.Fragment>
              ))}
            </div>

            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search files..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10 pr-4 py-2 text-black border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 w-64"
                />
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm' : ''}`}
                >
                  <Grid className="w-4 h-4 text-gray-600" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded ${viewMode === 'list' ? 'bg-white shadow-sm' : ''}`}
                >
                  <List className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowNewFolderModal(true)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700 flex items-center gap-2"
            >
              <FolderPlus className="w-4 h-4" />
              New Folder
            </button>
            {selectedFiles.length > 0 && (
              <button 
                onClick={handleBulkDelete}
                className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete ({selectedFiles.length})
              </button>
            )}
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader className="w-8 h-8 text-orange-600 animate-spin" />
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="text-center py-12">
              <Folder className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">No files found</p>
              <button
                onClick={() => setShowUploadModal(true)}
                className="cursor-pointer text-orange-600 hover:text-orange-700 font-medium"
              >
                Upload your first file
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredFiles.map((file) => (
                <div
                  key={file.id}
                  className={`relative group bg-white rounded-lg border-2 transition-all hover:shadow-lg cursor-pointer ${
                    selectedFiles.includes(file.id) ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                  onClick={() => handleViewFile(file)}
                >
                  <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowDropdown(showDropdown === file.id ? null : file.id);
                      }}
                      className="p-1 bg-white rounded-lg shadow-md hover:bg-gray-50"
                    >
                      <MoreVertical className="w-4 h-4 text-gray-600" />
                    </button>

                    {showDropdown === file.id && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewFile(file);
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          {file.type === 'folder' ? 'Open' : 'View'}
                        </button>
                        {file.type === 'file' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadFile(file.id, file.name);
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                          >
                            <Download className="w-4 h-4" />
                            Download
                          </button>
                        )}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                openRenameModal(file);
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                        >
                            <Edit2 className="w-4 h-4" />
                            Rename
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteFile(file.id, file.type);
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <div className="flex items-center justify-center h-24 mb-3">
                      {file.type === 'folder' ? (
                        <Folder className="w-16 h-16 text-orange-500" />
                      ) : (
                        getFileIcon(file.fileType)
                      )}
                    </div>
                    <div className="text-sm font-medium text-gray-900 truncate mb-1">
                      {file.name}
                    </div>
                    <div className="text-xs text-gray-500">{file.size}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="w-12 px-4 py-3">
                    </th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Name</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Owner</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Modified</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Size</th>
                    <th className="w-12 px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredFiles.map((file) => (
                    <tr 
                      key={file.id} 
                      className="hover:bg-gray-50 cursor-pointer" 
                      onClick={() => handleViewFile(file)}
                    >
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedFiles.includes(file.id)}
                          onChange={() => toggleFileSelection(file.id)}
                          className="w-4 h-4 rounded"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {file.type === 'folder' ? (
                            <Folder className="w-5 h-5 text-orange-500 shrink-0" />
                          ) : (
                            <div className="shrink-0">{getFileIcon(file.fileType)}</div>
                          )}
                          <span className="text-sm font-medium text-gray-900">{file.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{file.owner}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(file.modified).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{file.size}</td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <button 
                          onClick={() => setShowDropdown(showDropdown === file.id ? null : file.id)}
                          className="p-1 hover:bg-gray-100 rounded relative"
                        >
                          <MoreVertical className="w-4 h-4 text-gray-500" />
                        </button>
                        {showDropdown === file.id && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewFile(file);
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          {file.type === 'folder' ? 'Open' : 'View'}
                        </button>
                        {file.type === 'file' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadFile(file.id, file.name);
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                          >
                            <Download className="w-4 h-4" />
                            Download
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteFile(file.id, file.type);
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>

      {/* Preview Modal */}
{previewFile && (
  <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
    <div className="bg-white rounded-xl shadow-xl w-[90vw] h-[90vh] flex flex-col">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <h2 className="font-semibold text-gray-800 truncate">
          {previewFile.name}
        </h2>
        <button
          onClick={() => {
            URL.revokeObjectURL(previewUrl!);
            setPreviewFile(null);
            setPreviewUrl(null);
          }}
          className="p-2 cursor-pointer text-gray-700 hover:bg-gray-100 rounded-lg"
        >
          ✕
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 bg-gray-100 flex items-center justify-center overflow-hidden">
        {previewLoading && (
          <div className="text-gray-600">Loading preview...</div>
        )}

        {!previewLoading && previewUrl && (
          <>
            {/* IMAGE */}
            {previewFile.mimeType?.startsWith('image/') && (
              <img
                src={previewUrl}
                alt={previewFile.name}
                className="max-h-full max-w-full object-contain"
              />
            )}

            {/* PDF */}
            {previewFile.mimeType === 'application/pdf' && (
              <iframe
                src={previewUrl}
                className="w-full h-full"
                title="PDF Preview"
              />
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-3 px-4 py-3 border-t">
        <button
          onClick={() => handleDownloadFile(previewFile.id, previewFile.name)}
          className="px-4 py-2 bg-linear-to-r cursor-pointer from-red-500 via-orange-500 to-yellow-500 text-white rounded-lg hover:from-red-600 hover:via-orange-600 hover:to-yellow-600"
        >
          Download
        </button>
        <button
          onClick={() => {
            URL.revokeObjectURL(previewUrl!);
            setPreviewFile(null);
            setPreviewUrl(null);
          }}
          className="px-4 py-2 cursor-pointer text-gray-700 border rounded-lg hover:bg-gray-100"
        >
          Close
        </button>
      </div>

    </div>
  </div>
)}
      {/* Rename Modal */}
{showRenameModal && renamingItem && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
      
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-900">
          Rename {renamingItem.type === 'folder' ? 'Folder' : 'File'}
        </h2>
        <button
          onClick={() => setShowRenameModal(false)}
          className="p-2 cursor-pointer text-gray-700 hover:bg-gray-100 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-6">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="text-gray-700 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleRename();
            if (e.key === 'Escape') setShowRenameModal(false);
          }}
        />
      </div>

      <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
        <button
          onClick={() => setShowRenameModal(false)}
          className="px-4 py-2 cursor-pointer text-gray-700 hover:bg-gray-100 rounded-lg"
        >
          Cancel
        </button>
        <button
          onClick={handleRename}
          className="px-6 py-2 cursor-pointer bg-linear-to-r from-red-500 via-orange-500 to-yellow-500 text-white rounded-lg hover:from-red-600 hover:via-orange-600 hover:to-yellow-600"
        >
          Rename
        </button>
      </div>

    </div>
  </div>
)}


      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Upload Files</h2>
              <button
                onClick={() => setShowUploadModal(false)}
                disabled={uploading}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                {uploading ? (
                  <>
                    <Loader className="w-12 h-12 text-orange-600 animate-spin mb-4" />
                    <p className="text-gray-600 font-medium">Uploading...</p>
                  </>
                ) : (
                  <>
                    <Upload className="w-12 h-12 text-gray-400 mb-4" />
                    <p className="text-gray-600 font-medium mb-2">Click to upload or drag and drop</p>
                    <p className="text-sm text-gray-500">Any file up to 100MB</p>
                  </>
                )}
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200">
                <button
                    onClick={() => setShowUploadModal(false)}
                    disabled={uploading}
                    className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                >
                Cancel
                </button>
            </div>
          </div>
        </div>
      )}

      {/* New Folder Modal */}
      {showNewFolderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Create New Folder</h2>
              <button
                onClick={() => setShowNewFolderModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Folder name"
                className="text-black w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                onKeyPress={(e) => e.key === 'Enter' && handleCreateFolder()}
                autoFocus
              />
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowNewFolderModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateFolder}
                className="px-6 py-2 bg-linear-to-r from-red-500 via-orange-500 to-yellow-500 text-white rounded-lg hover:from-red-600 hover:via-orange-600 hover:to-yellow-600"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileManagementPage;