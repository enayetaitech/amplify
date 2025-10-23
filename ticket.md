1. Observer sidebar mobile view need to fix.
2. Observer observation small screen sidebar open should be made false.
3. ✅ FIXED - When session is added to a new project (status changes from draft to active), sidebar doesn't update
   - Root cause: Cache invalidation was missing for project queries when sessions are created/deleted/edited
   - Solution: Added invalidation for ["project", projectId] and ["projectsByUser"] queries in all session mutations
4. ✅ FIXED - After clicking meeting end button it takes 2 min to end the meeting
   - Root cause: Video processing (HLS to MP4 conversion) was blocking HTTP response
   - Solution: Moved deliverables processing to background, ongoing flag now set immediately
5. ✅ FIXED - After login super admin/amplify admin should not navigate to the project page
   - Solution: SuperAdmin and AmplifyAdmin now redirect to their profile page (/my-profile/{userId}) instead of /projects
