import os
import sys

def main():
    # 1. Patch apps/lms/lms/lms/api.py (for custom endpoints)
    api_path = '/home/frappe/frappe-bench/apps/lms/lms/lms/api.py'
    if not os.path.exists(api_path):
        print(f"❌ Error: {api_path} not found!")
        sys.exit(1)

    with open(api_path, 'r') as f:
        content = f.read()

    custom_funcs = [
        'get_google_auth_url', 'test_google_auth_traceback', 'get_api_file', 
        'execute_py', 'get_courses_optimized', 'get_course_syllabus_optimized',
        'sign_jwt', 'get_jwt', 'retrieve_secure_chunks_internal', 
        'invalidate_permission_cache', 'get_lms_students_optimized',
        'save_course_lesson_custom', 'save_course_chapter_custom',
        'read_any_file', 'get_bench_logs', 'get_environ_debug', 'test_login_via_google'
    ]
    marker = "# --- BEGIN ANTI-GRAVITY CUSTOM ENDPOINTS ---"
    if marker in content:
        content = content.split(marker)[0].rstrip()
    else:
        for func in custom_funcs:
            if ("def " + func) in content:
                idx = content.find("def " + func)
                content = content[:idx].rstrip()
                break

    patch_code = "\n\n" + marker + """

@frappe.whitelist(allow_guest=True)
def get_google_auth_url(redirect_to: str = None):
    import frappe
    try:
        from frappe.utils.oauth import get_oauth2_authorize_url
        return get_oauth2_authorize_url("google", redirect_to)
    except Exception as e:
        frappe.log_error(title="Google Auth URL Error", message=str(e))
        return {
            "error": "Could not generate Google authorization URL"
        }

@frappe.whitelist(allow_guest=True)
def get_courses_optimized():
    import frappe
    try:
        courses = frappe.get_all("LMS Course", 
                                 fields=["name", "title", "published", "creation", "category", "short_introduction", "lessons"],
                                 limit_page_length=100)
        
        enrollment_counts = {}
        try:
            counts = frappe.db.sql('''
                select course, count(name) as count
                from `tabLMS Enrollment`
                group by course
            ''', as_dict=True)
            for row in counts:
                enrollment_counts[row["course"]] = row["count"]
        except Exception:
            pass

        result = []
        for c in courses:
            c_name = c["name"]
            result.append({
                "name": c_name,
                "title": c.get("title") or c_name,
                "status": "Published" if c.get("published") else "Draft",
                "creation": str(c.get("creation") or ""),
                "category": c.get("category") or "General",
                "short_introduction": c.get("short_introduction") or "",
                "lessonsCount": len(c.get("lessons") or []),
                "enrollmentCount": enrollment_counts.get(c_name, 0)
            })
            
        return result
    except Exception as e:
        frappe.log_error(title="get_courses_optimized Error", message=str(e))
        return {
            "error": "Failed to retrieve courses"
        }

@frappe.whitelist(allow_guest=True)
def get_course_syllabus_optimized(course_id: str):
    import frappe
    import json
    try:
        course = frappe.get_doc("LMS Course", course_id)
        
        modules = []
        chapter_names = [ch.chapter for ch in course.chapters or [] if ch.chapter]
        if chapter_names:
            chapters = [frappe.get_doc("Course Chapter", name) for name in chapter_names]
            
            lesson_names = []
            for ch in chapters:
                for l_ref in ch.lessons or []:
                    if l_ref.lesson:
                        lesson_names.append(l_ref.lesson)
                        
            lessons_by_name = {}
            if lesson_names:
                lessons_list = frappe.get_all("Course Lesson", 
                                             filters={"name": ["in", lesson_names]},
                                             fields=["name", "title", "youtube", "body", "instructor_notes"])
                lessons_by_name = {l["name"]: l for l in lessons_list}
                
            for ch in chapters:
                lessons = []
                for l_ref in ch.lessons or []:
                    l_name = l_ref.lesson
                    if l_name in lessons_by_name:
                        lDoc = lessons_by_name[l_name]
                        
                        pts = ["Key concept introduction."]
                        quiz_questions = []
                        coding_exercise = {
                            "hasExercise": False,
                            "language": "python",
                            "instruction": "",
                            "starterCode": "",
                            "solutionCode": "",
                            "testCases": []
                        }
                        
                        notes = lDoc.get("instructor_notes")
                        if notes:
                            try:
                                meta = json.loads(notes)
                                if isinstance(meta, dict):
                                    if isinstance(meta.get("pts"), list):
                                        pts = meta["pts"]
                                    if isinstance(meta.get("quizQuestions"), list):
                                        quiz_questions = meta["quizQuestions"]
                                    if isinstance(meta.get("codingExercise"), dict):
                                        coding_exercise = meta["codingExercise"]
                            except Exception:
                                pass
                                
                        lessons.append({
                            "id": l_name,
                            "title": lDoc.get("title") or l_name,
                            "youtube": lDoc.get("youtube") or "",
                            "body": lDoc.get("body") or "",
                            "pts": pts,
                            "quizQuestions": quiz_questions,
                            "codingExercise": coding_exercise
                        })
                modules.append({
                    "id": ch.name,
                    "title": ch.title or ch.name,
                    "lessons": lessons
                })
                
        return {
            "title": course.title or course.name,
            "description": course.description or course.short_introduction or "",
            "category": course.category or "General",
            "modules": modules
        }
    except Exception as e:
        frappe.log_error(title="get_course_syllabus_optimized Error", message=str(e))
        return {
            "error": "Failed to retrieve course syllabus"
        }

@frappe.whitelist()
def save_course_lesson_custom(lesson_id: str, title: str = None, chapter_id: str = None, youtube: str = None, body: str = None, instructor_notes: str = None):
    import frappe
    try:
        user = frappe.session.user
        if not user or user == "Guest":
            frappe.throw("Authentication required to modify course lessons.", frappe.PermissionError)

        roles = frappe.get_roles(user)
        is_authorized = user in ["Administrator", "admin@lms.com"] or any(
            r in roles for r in ["System Manager", "Course Creator", "Instructor", "Administrator"]
        )

        if not is_authorized:
            frappe.throw("Permission Denied: Only Admin (admin@lms.com) or Instructors can edit lessons.", frappe.PermissionError)

        ch_link = chapter_id if (chapter_id and not chapter_id.startswith("ch_")) else ""

        if lesson_id and not lesson_id.startswith("les_") and frappe.db.exists("Course Lesson", lesson_id):
            doc = frappe.get_doc("Course Lesson", lesson_id)
            if title: doc.title = title
            if ch_link: doc.chapter = ch_link
            if youtube is not None: doc.youtube = youtube
            if body is not None: doc.body = body
            if instructor_notes is not None: doc.instructor_notes = instructor_notes
            doc.save(ignore_permissions=True)
        else:
            doc = frappe.get_doc({
                "doctype": "Course Lesson",
                "title": title or "New Lesson",
                "chapter": ch_link,
                "youtube": youtube or "",
                "body": body or "",
                "instructor_notes": instructor_notes or ""
            })
            doc.insert(ignore_permissions=True)
        frappe.db.commit()
        return {"status": "success", "name": doc.name, "youtube": doc.youtube}
    except Exception as e:
        frappe.log_error(title="save_course_lesson_custom error", message=str(e))
        return {"status": "error", "message": "Failed to save lesson"}

@frappe.whitelist()
def save_course_chapter_custom(chapter_id: str, title: str = None, course: str = None, lessons: list = None):
    import frappe
    import json
    try:
        user = frappe.session.user
        if not user or user == "Guest":
            frappe.throw("Authentication required to modify course chapters.", frappe.PermissionError)

        roles = frappe.get_roles(user)
        is_authorized = user in ["Administrator", "admin@lms.com"] or any(
            r in roles for r in ["System Manager", "Course Creator", "Instructor", "Administrator"]
        )

        if not is_authorized:
            frappe.throw("Permission Denied: Only Admin (admin@lms.com) or Instructors can edit chapters.", frappe.PermissionError)

        if isinstance(lessons, str):
            try:
                lessons = json.loads(lessons)
            except Exception:
                pass

        if chapter_id and not chapter_id.startswith("ch_") and frappe.db.exists("Course Chapter", chapter_id):
            doc = frappe.get_doc("Course Chapter", chapter_id)
            if title: doc.title = title
            if course: doc.course = course
            if lessons is not None and isinstance(lessons, list):
                doc.lessons = []
                for l in lessons:
                    l_id = l.get("lesson") if isinstance(l, dict) else str(l)
                    if frappe.db.exists("Course Lesson", l_id):
                        doc.append("lessons", {"lesson": l_id})
            doc.save(ignore_permissions=True)
        else:
            doc = frappe.get_doc({
                "doctype": "Course Chapter",
                "title": title or "New Chapter",
                "course": course or ""
            })
            if lessons and isinstance(lessons, list):
                for l in lessons:
                    l_id = l.get("lesson") if isinstance(l, dict) else str(l)
                    if frappe.db.exists("Course Lesson", l_id):
                        doc.append("lessons", {"lesson": l_id})
            doc.insert(ignore_permissions=True)
        frappe.db.commit()
        return {"status": "success", "name": doc.name, "modified_by": doc.modified_by}
    except Exception as e:
        frappe.log_error(title="save_course_chapter_custom error", message=str(e))
        return {"status": "error", "message": "Failed to save chapter"}

def sign_jwt(payload, secret_key):
    import hmac
    import hashlib
    import base64
    import json
    header = {"alg": "HS256", "typ": "JWT"}
    header_b64 = base64.urlsafe_b64encode(json.dumps(header).encode('utf-8')).decode('utf-8').rstrip('=')
    payload_b64 = base64.urlsafe_b64encode(json.dumps(payload).encode('utf-8')).decode('utf-8').rstrip('=')
    msg = f"{header_b64}.{payload_b64}".encode('utf-8')
    sig = hmac.new(secret_key.encode('utf-8'), msg, hashlib.sha256).digest()
    sig_b64 = base64.urlsafe_b64encode(sig).decode('utf-8').rstrip('=')
    return f"{header_b64}.{payload_b64}.{sig_b64}"

@frappe.whitelist()
def get_jwt():
    import frappe
    import time
    import os
    if frappe.session.user == "Guest":
        frappe.local.response["http_status_code"] = 401
        return {"error": "Unauthorized"}
    
    user = frappe.get_doc("User", frappe.session.user)
    tenant_id = user.get("tenant_id") or "default"
    
    payload = {
        "user_id": frappe.session.user,
        "tenant_id": tenant_id,
        "exp": int(time.time()) + 3600
    }
    
    secret_key = os.environ.get("JWT_SECRET") or getattr(frappe.local.conf, "encryption_key", None)
    if not secret_key:
        frappe.local.response["http_status_code"] = 500
        return {"error": "JWT configuration missing on server"}
    token = sign_jwt(payload, secret_key)
    return {"token": token}

@frappe.whitelist(allow_guest=True)
def retrieve_secure_chunks_internal(security_context: str, query_vector: str, similarity_threshold: float = 0.3, limit: int = 4):
    import frappe
    import json
    import os
    import requests
    import uuid
    
    req_token = frappe.get_request_header("X-Internal-Token")
    secret_token = os.environ.get("INTERNAL_SERVICE_TOKEN")
    if not secret_token or req_token != secret_token:
        frappe.local.response["http_status_code"] = 401
        return {"error": "Unauthorized service call"}
    
    try:
        sec_ctx = json.loads(security_context)
        q_vec = json.loads(query_vector)
    except Exception as e:
        frappe.local.response["http_status_code"] = 400
        return {"error": "Invalid JSON format"}
    
    tenant_id = sec_ctx.get("tenantId")
    user_id = sec_ctx.get("userId")
    session_id = sec_ctx.get("sessionId")
    course_id = sec_ctx.get("courseId")
    
    if not tenant_id or not user_id or not session_id or not course_id:
        frappe.local.response["http_status_code"] = 400
        return {"error": "Missing security context parameters"}

    redis_url = os.environ.get("UPSTASH_REDIS_REST_URL")
    redis_token = os.environ.get("UPSTASH_REDIS_REST_TOKEN")
    is_instructor = False
    
    if redis_url and redis_token:
        url_role = f"{redis_url}/get/user:is_instructor:{user_id}:{course_id}"
        try:
            is_instructor_res = requests.get(url_role, headers={"Authorization": f"Bearer {redis_token}"}).json()
            redis_val = is_instructor_res.get("result")
            if redis_val is not None:
                is_instructor = (redis_val == "true" or redis_val is True)
            else:
                db_inst = frappe.db.get_value("Course Instructor", {"parent": course_id, "instructor": user_id})
                is_instructor = bool(db_inst)
                requests.post(f"{redis_url}/set/user:is_instructor:{user_id}:{course_id}/{'true' if is_instructor else 'false'}?ex=300", 
                              headers={"Authorization": f"Bearer {redis_token}"})
        except Exception:
            db_inst = frappe.db.get_value("Course Instructor", {"parent": course_id, "instructor": user_id})
            is_instructor = bool(db_inst)
    else:
        db_inst = frappe.db.get_value("Course Instructor", {"parent": course_id, "instructor": user_id})
        is_instructor = bool(db_inst)
        
    has_session_doc = frappe.db.sql(
        "SELECT name FROM `tabLMS Session Document` WHERE session_id = %s AND owner = %s LIMIT 1",
        (session_id, user_id)
    )
    
    session_owner_filter = "AND owner = %s"
    role_filter = "AND (c.user_id = %s OR d.course_id = 'general' OR d.course_id IN (SELECT course FROM `tabLMS Enrollment` WHERE member = %s))"
    
    if is_instructor:
        session_owner_filter = "AND (owner = %s OR owner IN (SELECT parent FROM `tabHas Role` WHERE role IN ('Instructor', 'System Manager')))"
        role_filter = "AND (c.user_id = %s OR d.course_id = 'general' OR d.course_id = %s)"

    sql = f'''
        SELECT c.content,
               (1 - (c.embedding <=> %s)) AS similarity
        FROM `LMS Document Chunk` c
        JOIN `tabLMS Session Document` d ON c.document_id = d.name
        WHERE c.tenant_id = %s
          AND d.file_key IN (
            SELECT file_key FROM `tabLMS Session Document` WHERE session_id = %s {session_owner_filter}
          )
          {role_filter}
          AND (1 - (c.embedding <=> %s)) >= %s
        ORDER BY similarity DESC
        LIMIT %s
    '''
    
    q_vec_str = json.dumps(q_vec)
    
    if is_instructor:
        params = (
            q_vec_str,
            tenant_id,
            session_id,
            user_id,
            user_id,
            course_id,
            q_vec_str,
            similarity_threshold,
            limit
        )
    else:
        params = (
            q_vec_str,
            tenant_id,
            session_id,
            user_id,
            user_id,
            user_id,
            q_vec_str,
            similarity_threshold,
            limit
        )
        
    try:
        results = frappe.db.sql(sql, params, as_dict=True)
    except Exception as e:
        frappe.local.response["http_status_code"] = 500
        return {"error": "Database query error during vector retrieval"}

    audit_log = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "action": "query",
        "document_id": None,
        "session_id": session_id,
        "tenant_id": tenant_id,
        "ip_address": frappe.local.request_ip or "127.0.0.1"
    }
    try:
        frappe.db.sql('''
            INSERT INTO `LMS RAG Audit Log` 
            (id, user_id, action, document_id, session_id, tenant_id, ip_address)
            VALUES (%(id)s, %(user_id)s, %(action)s, %(document_id)s, %(session_id)s, %(tenant_id)s, %(ip_address)s)
        ''', audit_log)
        frappe.db.commit()
    except Exception:
        pass

    return {"chunks": results}

def invalidate_permission_cache(doc, method):
    import os
    import requests
    redis_url = os.environ.get("UPSTASH_REDIS_REST_URL")
    redis_token = os.environ.get("UPSTASH_REDIS_REST_TOKEN")
    if not redis_url or not redis_token:
        return
        
    try:
        doctype = doc.doctype
        user_id = getattr(doc, "member", None) or getattr(doc, "instructor", None)
        course_id = getattr(doc, "course", None) or getattr(doc, "parent", None)
        
        if user_id and course_id:
            if doctype == "LMS Enrollment":
                url = f"{redis_url}/del/user:is_enrolled:{user_id}:{course_id}"
                requests.post(url, headers={"Authorization": f"Bearer {redis_token}"})
            elif doctype == "Course Instructor":
                url = f"{redis_url}/del/user:is_instructor:{user_id}:{course_id}"
                requests.post(url, headers={"Authorization": f"Bearer {redis_token}"})
    except Exception:
        pass

@frappe.whitelist()
def get_lms_students_optimized():
    import frappe
    if frappe.session.user == "Guest":
        frappe.local.response["http_status_code"] = 401
        return {"error": "Unauthorized"}
    try:
        users = frappe.get_all("User", 
                               fields=["name", "email", "full_name", "enabled"],
                               filters=[["name", "not in", ["Administrator", "Guest"]], ["enabled", "=", 1]],
                               limit_page_length=500)
        return [{"username": u.email or u.name, "name": u.full_name or u.name} for u in users]
    except Exception as e:
        frappe.log_error(title="get_lms_students_optimized error", message=str(e))
        return {
            "error": "Failed to retrieve student directory"
        }
"""

    with open(api_path, 'w') as f:
        f.write(content.strip() + patch_code)
    print("✅ Patched apps/lms/lms/lms/api.py successfully with hardened endpoints!")

    # 2. Patch apps/lms/lms/lms/hooks.py (for startup monkey patching)
    hooks_path = '/home/frappe/frappe-bench/apps/lms/lms/hooks.py'
    if not os.path.exists(hooks_path):
        print(f"❌ Error: {hooks_path} not found!")
        sys.exit(1)

    with open(hooks_path, 'r') as f:
        hooks_content = f.read()

    # Clean out any old definitions of our custom cookie manager patch to avoid duplicates
    if '# MONKEY PATCH COOKIES AND GOOGLE OAUTH REDIRECTS' in hooks_content:
        print("Found existing monkey patches in hooks.py. Stripping old definition...")
        hooks_content = hooks_content.split('# MONKEY PATCH COOKIES AND GOOGLE OAUTH REDIRECTS')[0]
        hooks_content = hooks_content.rstrip()

    hooks_patch_code = """

# MONKEY PATCH COOKIES AND GOOGLE OAUTH REDIRECTS FOR CROSS-DOMAIN AUTHENTICATION
try:
    import os
    import frappe
    import frappe.auth
    
    orig_set_cookie = frappe.auth.CookieManager.set_cookie
    
    def patched_set_cookie(self, key, value, expires=None, secure=False, httponly=False, samesite="Lax", max_age=None, deduplicate=False):
        # Force secure=True and samesite="None" for all session/auth cookies set on HTTPS
        secure = True
        samesite = "None"
        return orig_set_cookie(self, key, value, expires=expires, secure=secure, httponly=httponly, samesite=samesite, max_age=max_age, deduplicate=deduplicate)
        
    frappe.auth.CookieManager.set_cookie = patched_set_cookie
    
    import frappe.integrations.oauth2_logins
    orig_login_via_google = frappe.integrations.oauth2_logins.login_via_google
    
    @frappe.whitelist(allow_guest=True)
    def patched_login_via_google(code: str, state: str, **kwargs):
        try:
            # Replace spaces with pluses to fix potential URL decoding issues
            if code and " " in code:
                code = code.replace(" ", "+")
                
            res = orig_login_via_google(code, state)
            # Intercept successful Google login redirect and append the sid query parameter
            if frappe.local.response.get("type") == "redirect":
                location = frappe.local.response.get("location")
                sid = frappe.session.get("sid") if hasattr(frappe.session, "get") else getattr(frappe.session, "sid", None)
                if location and sid:
                    from urllib.parse import urlparse, urlunparse, parse_qsl, urlencode
                    parsed = urlparse(location)
                    query = dict(parse_qsl(parsed.query))
                    query["sid"] = sid
                    frappe.local.response["location"] = urlunparse(parsed._replace(query=urlencode(query)))
            return res
        except Exception as e:
            import traceback
            frappe.log_error(title="Google Login Failed", message=f"Traceback:\\n{traceback.format_exc()}\\n\\nParams:\\nCode: {code}\\nState: {state}\\nKwargs: {kwargs}")
            frappe.db.commit()
            
            # Determine redirect destination
            import base64
            import json
            from urllib.parse import urlparse
            frontend_url = os.environ.get("FRONTEND_URL") or "https://vyomanta.onrender.com"
            try:
                state_data = json.loads(base64.b64decode(state).decode("utf-8"))
                redirect_to = state_data.get("redirect_to")
                if redirect_to:
                    parsed = urlparse(redirect_to)
                    frontend_url = f"{parsed.scheme}://{parsed.netloc}"
            except Exception:
                pass
            
            frappe.local.response["type"] = "redirect"
            frappe.local.response["location"] = f"{frontend_url}/login?error=oauth_failed"
            
    frappe.integrations.oauth2_logins.login_via_google = patched_login_via_google
    print("login_via_google monkey patched successfully to handle errors and redirect gracefully!")
    
    # REGISTER DYNAMIC DOC EVENTS FOR CACHE INVALIDATION
    try:
        doc_events.update({
            "LMS Enrollment": {
                "after_insert": "lms.lms.api.invalidate_permission_cache",
                "on_update": "lms.lms.api.invalidate_permission_cache",
                "on_trash": "lms.lms.api.invalidate_permission_cache"
            },
            "Course Instructor": {
                "after_insert": "lms.lms.api.invalidate_permission_cache",
                "on_update": "lms.lms.api.invalidate_permission_cache",
                "on_trash": "lms.lms.api.invalidate_permission_cache"
            }
        })
    except NameError:
        doc_events = {
            "LMS Enrollment": {
                "after_insert": "lms.lms.api.invalidate_permission_cache",
                "on_update": "lms.lms.api.invalidate_permission_cache",
                "on_trash": "lms.lms.api.invalidate_permission_cache"
            },
            "Course Instructor": {
                "after_insert": "lms.lms.api.invalidate_permission_cache",
                "on_update": "lms.lms.api.invalidate_permission_cache",
                "on_trash": "lms.lms.api.invalidate_permission_cache"
            }
        }
    
except Exception as patch_err:
    import frappe
    frappe.log_error(title="Monkey Patch failed in hooks.py", message=str(patch_err))
"""

    with open(hooks_path, 'w') as f:
        f.write(hooks_content.strip() + hooks_patch_code)
    print("✅ Patched apps/lms/lms/lms/hooks.py successfully!")

    # 3. Patch apps/lms/lms/__init__.py (to mock missing video watch duration index patch)
    init_path = '/home/frappe/frappe-bench/apps/lms/lms/__init__.py'
    if os.path.exists(init_path):
        with open(init_path, 'r') as f:
            init_content = f.read()
            
        if 'add_video_watch_duration_index' not in init_content:
            print("Injecting missing patch mock in apps/lms/lms/__init__.py...")
            mock_code = """
# MOCK MISSING VIDEO WATCH DURATION INDEX PATCH TO BYPASS STARTUP CRASH LOOP
import sys
from types import ModuleType
import lms

try:
    import lms.patches
except ImportError:
    patches_mod = ModuleType("lms.patches")
    sys.modules["lms.patches"] = patches_mod
    lms.patches = patches_mod

try:
    import lms.patches.v2_0
except ImportError:
    v2_0_mod = ModuleType("lms.patches.v2_0")
    sys.modules["lms.patches.v2_0"] = v2_0_mod
    lms.patches.v2_0 = v2_0_mod

missing_patch_name = "lms.patches.v2_0.add_video_watch_duration_index"
if missing_patch_name not in sys.modules:
    dummy_patch = ModuleType(missing_patch_name)
    dummy_patch.execute = lambda: None
    sys.modules[missing_patch_name] = dummy_patch
    setattr(lms.patches.v2_0, "add_video_watch_duration_index", dummy_patch)
"""
            with open(init_path, 'w') as f:
                f.write(init_content.strip() + "\n" + mock_code)
            print("✅ Patched apps/lms/lms/__init__.py successfully with patch mock!")

if __name__ == '__main__':
    main()
