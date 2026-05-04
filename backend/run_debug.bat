@echo off
set JAVA_TOOL_OPTIONS=
java -jar target\temple-registry-backend-0.0.1-SNAPSHOT.jar --trace --logging.level.root=TRACE > app_trace.log 2>&1
