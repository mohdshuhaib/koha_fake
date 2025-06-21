import AddMemberForm from '@/components/AddMemberForm'
import BulkUploadMembers from '@/components/BulkUploadMembers'
import MemberTable from '@/components/MemberTable'

export default function MemberPage() {
  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">📇 Member Management</h1>
      <AddMemberForm />
      <BulkUploadMembers />
      <MemberTable />
    </div>
  )
}
